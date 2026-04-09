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

export async function approveSubmission(reviewerId: string, submissionId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({ where: { id: submissionId } });
    if (!sub) throw HttpError.notFound("Submission not found");
    if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");

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

export async function rejectSubmission(reviewerId: string, submissionId: string, note: string) {
  if (!note.trim()) throw HttpError.badRequest("Rejection reason is required");
  const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!sub) throw HttpError.notFound("Submission not found");
  if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");

  return prisma.submission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", reviewedById: reviewerId, reviewedAt: new Date(), trainerNote: note },
  });
}
