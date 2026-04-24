import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";
import { deleteCacheByPattern, getJsonCache, setJsonCache } from "../../lib/cache.js";

const FEED_CACHE_TTL_SECONDS = 20;

const getFeedCacheKey = (currentUserId?: string, cursor?: string, limit = 20) => {
  return `feed:v1:user:${currentUserId ?? "anon"}:cursor:${cursor ?? "first"}:limit:${limit}`;
};

export const invalidateFeedCache = async () => {
  await deleteCacheByPattern("feed:v1:*");
};

const publishFeedEventToAllUsers = async (
  type: "post.created" | "post.updated",
  payload: Record<string, unknown>
) => {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    publishUserEvent(user.id, type, payload);
  }
};

export async function getFeed(currentUserId?: string, cursor?: string, limit = 20) {
  const cacheKey = getFeedCacheKey(currentUserId, cursor, limit);
  const cached = await getJsonCache<{ data: unknown[]; nextCursor: string | null }>(cacheKey, {
    endpoint: "GET /feed",
  });
  if (cached) {
    return cached;
  }

  const posts = await prisma.post.findMany({
    where: { status: "visible" },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      _count: { select: { comments: true, likes: true } },
    },
  });

  const hasMore = posts.length > limit;
  const rawData = hasMore ? posts.slice(0, limit) : posts;
  
  const data = rawData.map(post => ({
    ...post,
    isLiked: post.likes ? post.likes.length > 0 : false,
    likes: undefined // cleanup the nested array
  }));

  const result = { data, nextCursor: hasMore ? data[data.length - 1].id : null };
  await setJsonCache(cacheKey, result, FEED_CACHE_TTL_SECONDS);
  return result;
}

export async function createPost(userId: string, input: { type: string; mediaUrl: string; caption: string; source: string; location: string }) {
  const post = await prisma.post.create({
    data: { userId, ...input },
    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
  });

  await publishFeedEventToAllUsers("post.created", {
    postId: post.id,
    userId: post.userId,
    userName: post.user.name,
    userAvatar: post.user.avatar,
    userRole: post.user.role,
    source: post.source,
    type: post.type,
    mediaUrl: post.mediaUrl,
    caption: post.caption,
    location: post.location,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    likes: 0,
    comments: 0,
  });

  await invalidateFeedCache();

  return post;
}

export async function addComment(userId: string, postId: string, text: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw HttpError.notFound("Post not found");
  const comment = await prisma.comment.create({
    data: { postId, userId, text },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  const counts = await prisma.post.findUnique({
    where: { id: postId },
    select: { _count: { select: { comments: true, likes: true } } },
  });

  await publishFeedEventToAllUsers("post.updated", {
    postId,
    likes: counts?._count.likes ?? 0,
    comments: counts?._count.comments ?? 0,
    latestComment: {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      userId: comment.userId,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.avatar,
      },
    },
  });

  await invalidateFeedCache();

  return comment;
}

export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw HttpError.notFound("Post not found");
  await prisma.like.create({ data: { userId, postId } }).catch(() => {
    throw HttpError.conflict("Already liked");
  });

  const counts = await prisma.post.findUnique({
    where: { id: postId },
    select: { _count: { select: { comments: true, likes: true } } },
  });

  await publishFeedEventToAllUsers("post.updated", {
    postId,
    likes: counts?._count.likes ?? 0,
    comments: counts?._count.comments ?? 0,
    likedByUserId: userId,
    liked: true,
  });

  await invalidateFeedCache();
}

export async function unlikePost(userId: string, postId: string) {
  const record = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (!record) throw HttpError.notFound("Like not found");
  await prisma.like.delete({ where: { id: record.id } });

  const counts = await prisma.post.findUnique({
    where: { id: postId },
    select: { _count: { select: { comments: true, likes: true } } },
  });

  await publishFeedEventToAllUsers("post.updated", {
    postId,
    likes: counts?._count.likes ?? 0,
    comments: counts?._count.comments ?? 0,
    likedByUserId: userId,
    liked: false,
  });

  await invalidateFeedCache();
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}
