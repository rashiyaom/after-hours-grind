import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

export async function getTodayPlan(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile?.currentPlanId) return null;

  const plan = await prisma.plan.findUnique({
    where: { id: profile.currentPlanId },
    include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
  });
  return plan;
}

export async function createSubmission(studentId: string, input: { planTaskId?: string; mediaUrl: string }) {
  return prisma.submission.create({
    data: { studentId, planTaskId: input.planTaskId, mediaUrl: input.mediaUrl },
  });
}

export async function approveSubmission(reviewerId: string, reviewerRole: string, submissionId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { student: { include: { studentProfile: true } } },
    });
    if (!sub) throw HttpError.notFound("Submission not found");
    if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");
    if (reviewerRole === "TRAINER" && sub.student.studentProfile?.trainerId !== reviewerId) {
      throw HttpError.forbidden("You can only review submissions from your assigned students");
    }

    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: { status: "APPROVED", reviewedById: reviewerId, reviewedAt: new Date(), trainerNote: note },
    });

    // Award points
    if (sub.planTaskId) {
      const task = await tx.planTask.findUnique({ where: { id: sub.planTaskId } });
      if (task) {
        await tx.studentProfile.update({
          where: { userId: sub.studentId },
          data: { totalPoints: { increment: task.points } },
        });
      }
    }

    // Create notification for student
    await tx.notification.create({
      data: {
        userId: sub.studentId,
        type: "trainer",
        title: "Submission Approved",
        message: note ? `Your submission was approved: "${note}"` : "Your submission was approved!",
      },
    });

    return updated;
  });
}

export async function rejectSubmission(reviewerId: string, reviewerRole: string, submissionId: string, note: string) {
  if (!note.trim()) throw HttpError.badRequest("Rejection reason is required");
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: { include: { studentProfile: true } } },
  });
  if (!sub) throw HttpError.notFound("Submission not found");
  if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");
  if (reviewerRole === "TRAINER" && sub.student.studentProfile?.trainerId !== reviewerId) {
    throw HttpError.forbidden("You can only review submissions from your assigned students");
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", reviewedById: reviewerId, reviewedAt: new Date(), trainerNote: note },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: sub.studentId,
      type: "trainer",
      title: "Submission Rejected",
      message: `Your submission was rejected: "${note}"`,
    },
  });

  return updated;
}

export async function createPlan(trainerId: string, input: { 
  name: string; 
  duration: number; 
  goalType: string; 
  difficulty: string; 
  studentIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        name: input.name,
        trainerId,
        difficulty: input.difficulty,
        goalType: input.goalType,
        status: "ACTIVE",
      },
    });

    const daysData = Array.from({ length: input.duration }, (_, i) => ({
      planId: plan.id,
      day: i + 1,
    }));
    
    await tx.planDay.createMany({ data: daysData });

    if (input.studentIds.length > 0) {
      await tx.studentProfile.updateMany({
        where: { userId: { in: input.studentIds } },
        data: { 
          currentPlanId: plan.id,
          onboardingCompleted: true
        }
      });

      // Notify assigned students
      for (const studentId of input.studentIds) {
        await tx.notification.create({
          data: {
            userId: studentId,
            type: "plan",
            title: "New Plan Assigned",
            message: `You've been assigned a new plan: "${input.name}"`,
          },
        });
      }
    }

    return plan;
  });
}

export async function submitPlanForApproval(studentId: string, planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw HttpError.notFound("Plan not found");
  if (plan.studentId !== studentId) throw HttpError.forbidden("Not your plan");
  if (plan.status !== "DRAFT") throw HttpError.badRequest("Plan is not in draft status");

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { status: "PENDING_APPROVAL" },
  });

  // Notify trainer if assigned
  if (plan.trainerId) {
    await prisma.notification.create({
      data: {
        userId: plan.trainerId,
        type: "plan",
        title: "Plan Review Requested",
        message: `A student submitted plan "${plan.name}" for your review`,
      },
    });
  }

  return updated;
}

export async function reviewPlan(reviewerId: string, planId: string, action: "approve" | "reject", note?: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw HttpError.notFound("Plan not found");
  if (plan.status !== "PENDING_APPROVAL") throw HttpError.badRequest("Plan is not pending approval");

  const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
  
  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { status: newStatus, reviewNote: note },
  });

  // If approved, assign to student
  if (action === "approve" && plan.studentId) {
    await prisma.studentProfile.update({
      where: { userId: plan.studentId },
      data: { currentPlanId: planId },
    });
  }

  // Notify student
  if (plan.studentId) {
    await prisma.notification.create({
      data: {
        userId: plan.studentId,
        type: "plan",
        title: action === "approve" ? "Plan Approved!" : "Plan Needs Changes",
        message: note || (action === "approve" ? "Your plan has been approved and is now active." : "Your plan was not approved. Please review the feedback."),
      },
    });
  }

  return updated;
}

export async function getPendingPlans(trainerId: string) {
  return prisma.plan.findMany({
    where: { trainerId, status: "PENDING_APPROVAL" },
    include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTrainerStudents(trainerId: string) {
  return prisma.studentProfile.findMany({
    where: { trainerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          isBanned: true,
        },
      },
    }
  });
}

export async function assignStudentToTrainer(trainerId: string, studentId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!student) throw HttpError.notFound("Student not found");

  await prisma.studentProfile.update({
    where: { userId: studentId },
    data: { trainerId },
  });

  await prisma.notification.create({
    data: {
      userId: studentId,
      type: "trainer",
      title: "Trainer Assigned",
      message: "You've been assigned a new trainer!",
    },
  });
}

export async function unassignStudent(trainerId: string, studentId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!student) throw HttpError.notFound("Student not found");
  if (student.trainerId !== trainerId) throw HttpError.forbidden("Not your student");

  await prisma.studentProfile.update({
    where: { userId: studentId },
    data: { trainerId: null },
  });
}

export async function getSubmissions(userId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.submission.findMany({
      include: { 
        student: { select: { id: true, name: true, avatar: true } },
        planTask: { 
          include: { 
            planDay: { 
              include: { 
                plan: { select: { name: true } } 
              } 
            } 
          } 
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  return prisma.submission.findMany({
    where: {
      student: { studentProfile: { trainerId: userId } }
    },
    include: {
      student: { select: { id: true, name: true, avatar: true } },
      planTask: { 
        include: { 
          planDay: { 
            include: { 
              plan: { select: { name: true } } 
            } 
          } 
        } 
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentDetail(trainerId: string, studentId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
      },
    },
  });

  if (!profile) throw HttpError.notFound("Student not found");
  if (profile.trainerId !== trainerId) throw HttpError.forbidden("Not your student");

  const [submissions, currentPlan, progressEntries] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { planTask: true },
    }),
    profile.currentPlanId
      ? prisma.plan.findUnique({
          where: { id: profile.currentPlanId },
          include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
        })
      : null,
    prisma.progressEntry.findMany({
      where: { userId: studentId },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return {
    profile,
    submissions,
    currentPlan,
    progressEntries,
  };
}
