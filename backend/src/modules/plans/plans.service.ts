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

  return prisma.submission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", reviewedById: reviewerId, reviewedAt: new Date(), trainerNote: note },
  });
}
export async function createPlan(trainerId: string, input: { 
  name: string; 
  duration: number; 
  goalType: string; 
  difficulty: string; 
  studentIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Create the base Plan
    const plan = await tx.plan.create({
      data: {
        name: input.name,
        trainerId,
        difficulty: input.difficulty,
        goalType: input.goalType,
        status: "ACTIVE", // Auto-activate for trainer-created plans
      },
    });

    // 2. Initialize empty days based on duration
    const daysData = Array.from({ length: input.duration }, (_, i) => ({
      planId: plan.id,
      day: i + 1,
    }));
    
    await tx.planDay.createMany({
      data: daysData
    });

    // 3. Assign plan to students
    if (input.studentIds.length > 0) {
      await tx.studentProfile.updateMany({
        where: { userId: { in: input.studentIds } },
        data: { 
          currentPlanId: plan.id,
          onboardingCompleted: true // If a trainer manually assigns, we skip onboarding hurdle
        }
      });
    }

    return plan;
  });
}

export async function getTrainerStudents(trainerId: string) {
    return prisma.studentProfile.findMany({
        where: { trainerId },
        include: { user: true }
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
  
  // For trainers, get submissions from their assigned students
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
