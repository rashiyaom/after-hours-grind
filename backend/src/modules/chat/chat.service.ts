import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

export async function getThreads(userId: string) {
  return prisma.chatThread.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getMessages(userId: string, threadId: string, limit = 50) {
  // Verify participant
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) throw HttpError.forbidden("Not a participant");

  // Update lastRead
  await prisma.threadParticipant.update({ where: { id: participant.id }, data: { lastRead: new Date() } });

  return prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function sendMessage(userId: string, threadId: string, text: string) {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) throw HttpError.forbidden("Not a participant");

  const msg = await prisma.chatMessage.create({
    data: { threadId, senderId: userId, text },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  return msg;
}
