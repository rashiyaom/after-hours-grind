import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

const safeStudentProfileSelect = {
    id: true, userId: true, collegeId: true, heightCm: true, weightKg: true,
    fitnessGoal: true, streak: true, totalPlansCompleted: true, totalPoints: true,
    trainerId: true, currentPlanId: true, onboardingCompleted: true, onboardingStep: true,
    sport: true, team: true,
} as const;

const safeTrainerProfileSelect = {
    id: true, userId: true, specialization: true, experience: true,
    certifications: true, isVerified: true,
} as const;

const safeUserSelect = {
    id: true, email: true, name: true, avatar: true, role: true,
    createdAt: true, updatedAt: true, isBanned: true,
    studentProfile: { select: safeStudentProfileSelect },
    trainerProfile: { select: safeTrainerProfileSelect },
} as const;

export async function getAllUsersAdmin() {
    return prisma.user.findMany({ select: safeUserSelect, orderBy: { createdAt: "desc" } });
}

export async function toggleUserBan(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw HttpError.notFound("User not found");
    return prisma.user.update({
        where: { id: userId },
        data: { isBanned: !user.isBanned },
        select: safeUserSelect,
    });
}

export async function changeUserRole(userId: string, newRole: "STUDENT" | "TRAINER" | "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw HttpError.notFound("User not found");

    return prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: safeUserSelect,
        });

        // Create profiles if needed
        if (newRole === "STUDENT") {
            await tx.studentProfile.upsert({
                where: { userId },
                create: { userId },
                update: {},
            });
        } else if (newRole === "TRAINER") {
            await tx.trainerProfile.upsert({
                where: { userId },
                create: { userId },
                update: {},
            });
        }

        return updated;
    });
}

// Content moderation
export async function getFlaggedContent() {
    const [flaggedPosts, pendingSubmissions] = await Promise.all([
        prisma.post.findMany({
            where: { status: { in: ["under-review", "hidden"] } },
            include: {
                user: { select: { id: true, name: true, avatar: true, role: true } },
                _count: { select: { comments: true, likes: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.submission.findMany({
            where: { status: "PENDING" },
            include: {
                student: { select: { id: true, name: true, avatar: true } },
                planTask: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
    ]);

    return { flaggedPosts, pendingSubmissions };
}

export async function updatePostModeration(postId: string, status: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw HttpError.notFound("Post not found");
    
    const updated = await prisma.post.update({ where: { id: postId }, data: { status } });

    // Notify post owner
    await prisma.notification.create({
        data: {
            userId: post.userId,
            type: "system",
            title: status === "hidden" ? "Post Hidden" : "Post Reviewed",
            message: status === "hidden"
                ? "Your post has been hidden by a moderator for review."
                : "Your post has been reviewed and is now visible.",
        },
    });

    return updated;
}

export async function deletePostAdmin(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw HttpError.notFound("Post not found");
    await prisma.post.delete({ where: { id: postId } });

    await prisma.notification.create({
        data: {
            userId: post.userId,
            type: "system",
            title: "Post Removed",
            message: "A post of yours was removed for violating community guidelines.",
        },
    });
}

export async function getActivityLogs() {
    const [recentUsers, recentPosts, recentSubmissions] = await Promise.all([
        prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: safeUserSelect }),
        prisma.post.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } }),
        prisma.submission.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { student: { select: { id: true, name: true, avatar: true } } },
        })
    ]);

    return { users: recentUsers, posts: recentPosts, submissions: recentSubmissions };
}

export async function getAdminStats() {
    const [userCount, studentCount, trainerCount, postCount, submissionCount, pendingCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "TRAINER" } }),
        prisma.post.count(),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "PENDING" } }),
    ]);

    return { userCount, studentCount, trainerCount, postCount, submissionCount, pendingCount };
}
