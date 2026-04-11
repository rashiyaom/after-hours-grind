import { prisma } from "../../config/prisma.js";

export async function getLeaderboard(limit = 50) {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const profiles = await prisma.studentProfile.findMany({
    orderBy: { totalPoints: "desc" },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, avatar: true, role: true },
      },
    },
  });

  // Get submission counts for each user
  const userIds = profiles.map((p) => p.userId);
  const submissionCounts = await prisma.submission.groupBy({
    by: ["studentId"],
    where: { studentId: { in: userIds }, status: "APPROVED" },
    _count: true,
  });
  const progressAgg = await prisma.progressEntry.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      date: { gte: last7Days },
    },
    _sum: {
      stepCount: true,
      workoutMinutes: true,
    },
  });

  const subMap = new Map(submissionCounts.map((s) => [s.studentId, s._count]));
  const progressMap = new Map(
    progressAgg.map((row) => [
      row.userId,
      {
        steps: row._sum.stepCount ?? 0,
        workoutMinutes: row._sum.workoutMinutes ?? 0,
      },
    ])
  );

  const rows = profiles.map((p) => {
    const uploads = subMap.get(p.userId) ?? 0;
    const progress = progressMap.get(p.userId) ?? { steps: 0, workoutMinutes: 0 };
    const completionPercentage = Math.max(0, Math.min(100, Math.round((uploads / 14) * 100)));

    // Composite score keeps ranking dynamic as activity changes through the week.
    const score = Math.round(
      p.totalPoints +
      p.streak * 25 +
      progress.workoutMinutes * 2 +
      Math.min(progress.steps, 70000) / 100 +
      uploads * 8
    );

    return {
      userId: p.userId,
      name: p.user.name,
      avatar: p.user.avatar,
      score,
      streak: p.streak,
      steps: progress.steps,
      uploads,
      completionPercentage,
    };
  });

  rows.sort((a, b) => b.score - a.score);

  return rows.map((row, i) => ({
    rank: i + 1,
    ...row,
  }));
}
