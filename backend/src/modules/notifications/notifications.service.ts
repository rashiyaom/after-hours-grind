import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";
import { deleteCacheByPattern, getJsonCache, setJsonCache } from "../../lib/cache.js";

const NOTIFICATIONS_CACHE_TTL_SECONDS = 20;

const getNotificationsCacheKey = (userId: string, cursor?: string, limit = 20) => {
  return `notifications:v1:user:${userId}:cursor:${cursor ?? "first"}:limit:${limit}`;
};

export async function invalidateNotificationsCacheForUser(userId: string) {
  await deleteCacheByPattern(`notifications:v1:user:${userId}:*`);
}

export async function getNotifications(userId: string, cursor?: string, limit = 20) {
  const cacheKey = getNotificationsCacheKey(userId, cursor, limit);
  const cached = await getJsonCache<{ data: unknown[]; nextCursor: string | null }>(cacheKey, {
    endpoint: "GET /notifications",
  });
  if (cached) {
    return cached;
  }

  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  const result = {
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
  };

  await setJsonCache(cacheKey, result, NOTIFICATIONS_CACHE_TTL_SECONDS);
  return result;
}

export async function markRead(userId: string, notificationId: string) {
  const n = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!n || n.userId !== userId) throw HttpError.notFound("Notification not found");
  const updated = await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
  publishUserEvent(userId, "notification.updated", {
    notificationId: updated.id,
    read: updated.read,
  });

  await invalidateNotificationsCacheForUser(userId);
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

  await invalidateNotificationsCacheForUser(input.userId);
  return created;
}
