import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

const safeStudentProfileSelect = {
    id: true,
    userId: true,
    collegeId: true,
    heightCm: true,
    weightKg: true,
    fitnessGoal: true,
    streak: true,
    totalPlansCompleted: true,
    totalPoints: true,
    trainerId: true,
    currentPlanId: true,
    onboardingCompleted: true,
    onboardingStep: true,
    sport: true,
    team: true,
} as const;

const safeTrainerProfileSelect = {
    id: true,
    userId: true,
    specialization: true,
    experience: true,
    certifications: true,
    isVerified: true,
} as const;

const safeUserSelect = {
    id: true,
    email: true,
    name: true,
    avatar: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    isBanned: true,
    studentProfile: { select: safeStudentProfileSelect },
    trainerProfile: { select: safeTrainerProfileSelect },
} as const;

export async function getAllUsersAdmin() {
    return prisma.user.findMany({
        select: safeUserSelect,
        orderBy: { createdAt: "desc" }
    });
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
        prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: safeUserSelect }),
        prisma.post.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
        prisma.submission.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        email: true,
                        isBanned: true,
                    },
                },
            },
        })
    ]);

    return {
        users: recentUsers,
        posts: recentPosts,
        submissions: recentSubmissions
    };
}
