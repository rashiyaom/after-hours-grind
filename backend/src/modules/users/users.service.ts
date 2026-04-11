import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import type { UpdateProfileInput } from "./users.schema.js";
import type { Prisma } from "@prisma/client";

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true, trainerProfile: true },
  });
  if (!user) throw HttpError.notFound("User not found");
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, avatar: true, role: true, createdAt: true,
      studentProfile: {
        select: {
          collegeId: true,
          heightCm: true,
          weightKg: true,
          fitnessGoal: true,
          streak: true,
          totalPlansCompleted: true,
          totalPoints: true,
          sport: true,
          team: true,
        },
      },
      trainerProfile: {
        select: {
          specialization: true,
          experience: true,
          certifications: true,
          isVerified: true,
        },
      },
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });
  if (!user) throw HttpError.notFound("User not found");
  return user;
}

export async function updateMe(userId: string, role: string, input: UpdateProfileInput) {
  const { name, avatar, collegeId, heightCm, weightKg, fitnessGoal, specialization, experience } = input;

  await prisma.user.update({
    where: { id: userId },
    data: { ...(name ? { name } : {}), ...(avatar ? { avatar } : {}) },
  });

  if (role === "STUDENT") {
    const {
      collegeId,
      heightCm,
      weightKg,
      fitnessGoal,
      onboardingDraft,
      onboardingStep,
    } = input;
    
    await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(collegeId !== undefined ? { collegeId } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
        ...(weightKg !== undefined ? { weightKg } : {}),
        ...(fitnessGoal !== undefined ? { fitnessGoal } : {}),
        ...(onboardingDraft !== undefined ? { onboardingDraft: onboardingDraft as Prisma.InputJsonValue } : {}),
        ...(onboardingStep !== undefined ? { onboardingStep } : {}),
      },
    });
  }

  if (role === "TRAINER" && (specialization || experience !== undefined)) {
    await prisma.trainerProfile.update({
      where: { userId },
      data: {
        ...(specialization !== undefined ? { specialization } : {}),
        ...(experience !== undefined ? { experience } : {}),
      },
    });
  }

  return getMe(userId);
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw HttpError.badRequest("Cannot follow yourself");
  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) throw HttpError.notFound("User not found");
  await prisma.follow.create({ data: { followerId, followingId } }).catch(() => {
    throw HttpError.conflict("Already following");
  });
}

export async function unfollowUser(followerId: string, followingId: string) {
  const record = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
  if (!record) throw HttpError.notFound("Not following this user");
  await prisma.follow.delete({ where: { id: record.id } });
}

export async function getFeaturedAthletes() {
  return prisma.studentProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      },
    },
    where: { sport: { not: null } }
  });
}

export async function getLeaderboard(filter: "points" | "streak" | "completed" = "points", limit: number = 20) {
  const orderBy: Record<string, any> = {};
  
  switch (filter) {
    case "streak":
      orderBy.streak = "desc";
      break;
    case "completed":
      orderBy.totalPlansCompleted = "desc";
      break;
    case "points":
    default:
      orderBy.totalPoints = "desc";
  }

  const leaderboard = await prisma.studentProfile.findMany({
    select: {
      id: true,
      totalPoints: true,
      streak: true,
      totalPlansCompleted: true,
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy,
    take: limit,
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user.id,
    name: entry.user.name,
    avatar: entry.user.avatar,
    totalPoints: entry.totalPoints,
    streak: entry.streak,
    totalPlansCompleted: entry.totalPlansCompleted,
  }));
}

export async function getLeaderboardMe(userId: string, filter: "points" | "streak" | "completed" = "points") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { studentProfile: { select: { id: true } } },
  });

  if (!user?.studentProfile) throw HttpError.notFound("Student profile not found");

  const orderBy: Record<string, any> = {};
  
  switch (filter) {
    case "streak":
      orderBy.streak = "desc";
      break;
    case "completed":
      orderBy.totalPlansCompleted = "desc";
      break;
    case "points":
    default:
      orderBy.totalPoints = "desc";
  }

  const rank = await prisma.studentProfile.count({
    where: {
      [filter === "streak" ? "streak" : filter === "completed" ? "totalPlansCompleted" : "totalPoints"]: {
        gt: filter === "streak" 
          ? (await prisma.studentProfile.findUnique({ where: { id: user.studentProfile.id } }))?.streak || 0
          : filter === "completed"
          ? (await prisma.studentProfile.findUnique({ where: { id: user.studentProfile.id } }))?.totalPlansCompleted || 0
          : (await prisma.studentProfile.findUnique({ where: { id: user.studentProfile.id } }))?.totalPoints || 0,
      },
    },
  });

  const userProfile = await prisma.studentProfile.findUnique({
    where: { id: user.studentProfile.id },
    select: {
      totalPoints: true,
      streak: true,
      totalPlansCompleted: true,
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!userProfile) throw HttpError.notFound("Student profile not found");

  return {
    rank: rank + 1,
    userId: userProfile.user.id,
    name: userProfile.user.name,
    avatar: userProfile.user.avatar,
    totalPoints: userProfile.totalPoints,
    streak: userProfile.streak,
    totalPlansCompleted: userProfile.totalPlansCompleted,
  };
}
