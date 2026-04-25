import { prisma } from "../../config/prisma.js";

export async function getAllAchievementDefs() {
  return prisma.achievementDef.findMany({ orderBy: { category: "asc" } });
}

export async function getUserAchievements(userId: string) {
  const [definitions, earned] = await Promise.all([
    prisma.achievementDef.findMany({ orderBy: { category: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

  return definitions.map((def) => ({
    ...def,
    earned: earnedMap.has(def.id),
    earnedDate: earnedMap.get(def.id) ?? null,
  }));
}

export async function checkAndAwardAchievements(userId: string) {
  const [profile, submissionCount, postCount, likesReceived] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.submission.count({ where: { studentId: userId, status: "APPROVED" } }),
    prisma.post.count({ where: { userId, source: { not: "strava" } } }),
    prisma.like.count({ where: { post: { userId, source: { not: "strava" } } } }),
  ]);

  const awarded: string[] = [];

  const checks: { key: string; condition: boolean }[] = [
    { key: "first_login", condition: true },
    { key: "streak_3", condition: (profile?.streak ?? 0) >= 3 },
    { key: "streak_7", condition: (profile?.streak ?? 0) >= 7 },
    { key: "streak_30", condition: (profile?.streak ?? 0) >= 30 },
    { key: "first_upload", condition: submissionCount >= 1 },
    { key: "tasks_10", condition: submissionCount >= 10 },
    { key: "tasks_50", condition: submissionCount >= 50 },
    { key: "first_post", condition: postCount >= 1 },
    { key: "likes_10", condition: likesReceived >= 10 },
    { key: "plan_complete", condition: (profile?.totalPlansCompleted ?? 0) >= 1 },
  ];

  for (const { key, condition } of checks) {
    if (!condition) continue;
    const def = await prisma.achievementDef.findUnique({ where: { key } });
    if (!def) continue;

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: def.id } },
    });
    if (existing) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: def.id },
    });

    // Award bonus points
    if (def.points > 0 && profile) {
      await prisma.studentProfile.update({
        where: { userId },
        data: { totalPoints: { increment: def.points } },
      });
    }

    awarded.push(def.name);
  }

  return awarded;
}
