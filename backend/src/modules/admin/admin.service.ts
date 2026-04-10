import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

export async function getAllUsersAdmin() {
    return prisma.user.findMany({
        include: {
            studentProfile: true,
            trainerProfile: true
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function toggleUserBan(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw HttpError.notFound("User not found");
    
    return prisma.user.update({
        where: { id: userId },
        data: { isBanned: !user.isBanned }
    });
}

export async function updatePostModeration(postId: string, status: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw HttpError.notFound("Post not found");
    
    return prisma.post.update({
        where: { id: postId },
        data: { status }
    });
}

export async function getActivityLogs() {
    // Currently we don't have a logs model, but we can aggregate from Prisma if needed
    // For now, return recent events/submissions as "activity"
    const [recentUsers, recentPosts, recentSubmissions] = await Promise.all([
        prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
        prisma.post.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
        prisma.submission.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { student: true } })
    ]);

    return {
        users: recentUsers,
        posts: recentPosts,
        submissions: recentSubmissions
    };
}
