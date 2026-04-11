import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

// Badge definitions
const BADGES = {
  b1: { name: "First Step", description: "Complete your first workout", icon: "🎯" },
  b2: { name: "Week Warrior", description: "Complete 7 consecutive workouts", icon: "⚡" },
  b3: { name: "Month Master", description: "Complete 30 workouts in a month", icon: "🏆" },
  b4: { name: "Streak King", description: "Maintain a 14-day streak", icon: "🔥" },
  b5: { name: "Social Butterfly", description: "Get 10 followers", icon: "🦋" },
  b6: { name: "Content Creator", description: "Post 5 progress updates", icon: "📸" },
  b7: { name: "Consistency Queen", description: "Complete 100 workouts total", icon: "👑" },
  b8: { name: "Goal Crusher", description: "Achieve a fitness milestone", icon: "💪" },
};

export async function getAchievements(studentId: string) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { badges: true },
  });

  if (!studentProfile) throw HttpError.notFound("Student profile not found");

  const earnedBadgeIds = studentProfile.badges.map((b) => b.badgeId);

  return {
    earned: studentProfile.badges.map((badge) => ({
      ...badge,
      ...BADGES[badge.badgeId as keyof typeof BADGES],
    })),
    available: Object.entries(BADGES)
      .filter(([id]) => !earnedBadgeIds.includes(id))
      .map(([id, badge]) => ({
        badgeId: id,
        ...badge,
        progress: 0,
      })),
  };
}

export async function getAchievementProgress(studentId: string) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      badges: true,
      user: {
        include: {
          _count: { select: { followers: true, posts: true } },
        },
      },
    },
  });

  if (!studentProfile) throw HttpError.notFound("Student profile not found");

  const earnedBadgeIds = new Set(studentProfile.badges.map((b) => b.badgeId));

  const progressData = {
    b1: { current: studentProfile.totalPlansCompleted > 0 ? 1 : 0, target: 1 },
    b2: { current: studentProfile.streak >= 7 ? 7 : studentProfile.streak, target: 7 },
    b3: { current: Math.min(studentProfile.totalPlansCompleted, 30), target: 30 },
    b4: { current: studentProfile.streak >= 14 ? 14 : studentProfile.streak, target: 14 },
    b5: { current: studentProfile.user._count.followers, target: 10 },
    b6: { current: studentProfile.user._count.posts, target: 5 },
    b7: { current: studentProfile.totalPlansCompleted, target: 100 },
    b8: { current: studentProfile.totalPoints > 0 ? 1 : 0, target: 1 },
  };

  return {
    badges: Object.entries(BADGES).map(([id, badge]) => ({
      badgeId: id,
      ...badge,
      earned: earnedBadgeIds.has(id),
      progress: progressData[id as keyof typeof progressData],
    })),
    stats: {
      totalEarned: studentProfile.badges.length,
      streak: studentProfile.streak,
      totalPoints: studentProfile.totalPoints,
      totalPlansCompleted: studentProfile.totalPlansCompleted,
    },
  };
}

export async function earnBadge(studentId: string, badgeId: string) {
  const badge = BADGES[badgeId as keyof typeof BADGES];
  if (!badge) throw HttpError.badRequest("Invalid badge ID");

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
  });
  if (!studentProfile) throw HttpError.notFound("Student profile not found");

  try {
    return await prisma.badge.create({
      data: {
        studentId,
        badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw HttpError.conflict("Badge already earned");
    }
    throw error;
  }
}
