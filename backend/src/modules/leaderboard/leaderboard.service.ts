import { prisma } from "../../config/prisma.js";

export async function getLeaderboard(limit = 50) {
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
  const subMap = new Map(submissionCounts.map((s) => [s.studentId, s._count]));

  return profiles.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    name: p.user.name,
    avatar: p.user.avatar,
    score: p.totalPoints,
    streak: p.streak,
    steps: 0, // placeholder until step tracking is implemented
    uploads: subMap.get(p.userId) ?? 0,
    completionPercentage: p.totalPlansCompleted > 0 ? 100 : 0,
  }));
}
