import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";

type SendMessageInput = {
  text?: string;
  type?: "text" | "reel-share" | "voice-note";
  voiceSeconds?: number;
  voiceAudioUrl?: string;
  reelPostId?: string;
  reelPreviewUrl?: string;
  reelCaption?: string;
};

const participantUserSelect = {
  id: true,
  name: true,
  avatar: true,
  role: true,
} as const;

const threadSummaryInclude = {
  participants: {
    include: { user: { select: participantUserSelect } },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  },
} as const;

const ensureThreadParticipant = async (userId: string, threadId: string) => {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) throw HttpError.forbidden("Not a participant");
  return participant;
};

const ensureDirectChatEligibility = async (actorId: string, targetUserId: string) => {
  if (actorId === targetUserId) {
    throw HttpError.badRequest("Cannot create a thread with yourself");
  }

  const [actor, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, studentProfile: { select: { trainerId: true } } },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, studentProfile: { select: { trainerId: true } } },
    }),
  ]);

  if (!actor) throw HttpError.unauthorized("Invalid user session");
  if (!target) throw HttpError.notFound("Participant not found");

  if (actor.role === "ADMIN" || target.role === "ADMIN") {
    throw HttpError.forbidden("Admin direct chat is not enabled");
  }

  if (actor.role === "TRAINER") {
    if (target.role !== "STUDENT") {
      throw HttpError.forbidden("Trainers can only chat with students");
    }

    if (target.studentProfile?.trainerId !== actor.id) {
      throw HttpError.forbidden("You can only chat with assigned students");
    }
  }

  if (actor.role === "STUDENT" && target.role === "TRAINER") {
    if (actor.studentProfile?.trainerId !== target.id) {
      throw HttpError.forbidden("You can only chat with your assigned trainer");
    }
  }
};

export async function getThreads(userId: string) {
  return prisma.chatThread.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: threadSummaryInclude,
  });
}

export async function createDirectThread(userId: string, participantId: string) {
  await ensureDirectChatEligibility(userId, participantId);

  const existing = await prisma.chatThread.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
        { participants: { every: { userId: { in: [userId, participantId] } } } },
      ],
    },
    include: threadSummaryInclude,
  });

  if (existing) return existing;

  return prisma.chatThread.create({
    data: {
      participants: {
        create: [{ userId }, { userId: participantId }],
      },
    },
    include: threadSummaryInclude,
  });
}

export async function getMessages(userId: string, threadId: string, limit = 50) {
  const participant = await ensureThreadParticipant(userId, threadId);

  // Update lastRead
  await prisma.threadParticipant.update({ where: { id: participant.id }, data: { lastRead: new Date() } });

  const messages = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  return messages.reverse();
}

export async function sendMessage(userId: string, threadId: string, input: SendMessageInput) {
  await ensureThreadParticipant(userId, threadId);

  const messageType =
    input.type === "voice-note" || input.type === "reel-share"
      ? input.type
      : "text";
  const normalizedText = (input.text ?? "").trim();

  if (messageType === "text" && !normalizedText) {
    throw HttpError.badRequest("Text message cannot be empty");
  }

  if (messageType === "voice-note" && !input.voiceAudioUrl) {
    throw HttpError.badRequest("Voice note requires audio payload");
  }

  if (input.voiceAudioUrl && input.voiceAudioUrl.length > 1_200_000) {
    throw HttpError.badRequest("Voice note payload too large");
  }

  const msg = await prisma.chatMessage.create({
    data: {
      threadId,
      senderId: userId,
      text:
        normalizedText ||
        (messageType === "voice-note"
          ? "Voice note"
          : messageType === "reel-share"
            ? "Shared a reel"
            : ""),
      type: messageType,
      voiceSeconds: input.voiceSeconds,
      voiceAudioUrl: input.voiceAudioUrl,
      reelPostId: input.reelPostId,
      reelPreviewUrl: input.reelPreviewUrl,
      reelCaption: input.reelCaption,
    },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  const participants = await prisma.threadParticipant.findMany({
    where: { threadId },
    select: { userId: true },
  });

  for (const participant of participants) {
    publishUserEvent(participant.userId, "chat.message", {
      threadId,
      messageId: msg.id,
      senderId: msg.senderId,
      text: msg.text,
      type: msg.type,
      voiceSeconds: msg.voiceSeconds,
      voiceAudioUrl: msg.voiceAudioUrl,
      reelPostId: msg.reelPostId,
      reelPreviewUrl: msg.reelPreviewUrl,
      reelCaption: msg.reelCaption,
      createdAt: msg.createdAt.toISOString(),
    });
  }

  await prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  return msg;
}
