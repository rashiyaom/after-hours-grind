import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";

export async function getNotifications(userId: string, cursor?: string, limit = 20) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
  };
}

export async function markRead(userId: string, notificationId: string) {
  const n = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!n || n.userId !== userId) throw HttpError.notFound("Notification not found");
  const updated = await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
  publishUserEvent(userId, "notification.updated", {
    notificationId: updated.id,
    read: updated.read,
  });
  return updated;
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
}) {
  const created = await prisma.notification.create({ data: input });
  publishUserEvent(input.userId, "notification.created", {
    notificationId: created.id,
    type: created.type,
    title: created.title,
    createdAt: created.createdAt.toISOString(),
  });
  return created;
}
