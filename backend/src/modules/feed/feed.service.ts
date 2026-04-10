import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

export async function getFeed(currentUserId?: string, cursor?: string, limit = 20) {
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

  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}

export async function createPost(userId: string, input: { type: string; mediaUrl: string; caption: string; source: string; location: string }) {
  return prisma.post.create({
    data: { userId, ...input },
    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
  });
}

export async function addComment(userId: string, postId: string, text: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw HttpError.notFound("Post not found");
  return prisma.comment.create({
    data: { postId, userId, text },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw HttpError.notFound("Post not found");
  await prisma.like.create({ data: { userId, postId } }).catch(() => {
    throw HttpError.conflict("Already liked");
  });
}

export async function unlikePost(userId: string, postId: string) {
  const record = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (!record) throw HttpError.notFound("Like not found");
  await prisma.like.delete({ where: { id: record.id } });
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}
