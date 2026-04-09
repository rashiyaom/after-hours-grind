import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import type { UpdateProfileInput } from "./users.schema.js";

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
      studentProfile: true, trainerProfile: true,
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

  if (role === "STUDENT" && (collegeId || heightCm || weightKg || fitnessGoal)) {
    await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(collegeId !== undefined ? { collegeId } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
        ...(weightKg !== undefined ? { weightKg } : {}),
        ...(fitnessGoal !== undefined ? { fitnessGoal } : {}),
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
