import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";

const PERMISSION_KEYS = [
    "view_dashboard",
    "manage_users",
    "moderate_content",
    "build_plans",
    "post_feed",
    "view_analytics",
] as const;

type PermissionKey = (typeof PERMISSION_KEYS)[number];
type PermissionRole = "STUDENT" | "TRAINER" | "ADMIN";

const DEFAULT_PERMISSION_MATRIX: Record<PermissionRole, Record<PermissionKey, boolean>> = {
    STUDENT: {
        view_dashboard: true,
        manage_users: false,
        moderate_content: false,
        build_plans: false,
        post_feed: true,
        view_analytics: false,
    },
    TRAINER: {
        view_dashboard: true,
        manage_users: false,
        moderate_content: false,
        build_plans: true,
        post_feed: true,
        view_analytics: true,
    },
    ADMIN: {
        view_dashboard: true,
        manage_users: true,
        moderate_content: true,
        build_plans: true,
        post_feed: true,
        view_analytics: true,
    },
};

const normalizeMatrix = (rows: Array<{ role: PermissionRole; permission: string; allowed: boolean }>) => {
    const base: Record<PermissionRole, Record<PermissionKey, boolean>> = {
        STUDENT: { ...DEFAULT_PERMISSION_MATRIX.STUDENT },
        TRAINER: { ...DEFAULT_PERMISSION_MATRIX.TRAINER },
        ADMIN: { ...DEFAULT_PERMISSION_MATRIX.ADMIN },
    };

    for (const row of rows) {
        if (!PERMISSION_KEYS.includes(row.permission as PermissionKey)) continue;
        const permission = row.permission as PermissionKey;
        base[row.role][permission] = row.allowed;
    }

    // Admin stays full-access regardless of persisted values.
    base.ADMIN = { ...DEFAULT_PERMISSION_MATRIX.ADMIN };
    return base;
};

async function ensurePermissionDefaults() {
    const rows = await prisma.rolePermission.findMany({
        where: { role: { in: ["STUDENT", "TRAINER"] } },
    });

    const existing = new Set(rows.map((row) => `${row.role}:${row.permission}`));
    const missing: Array<{ role: PermissionRole; permission: PermissionKey; allowed: boolean }> = [];

    for (const role of ["STUDENT", "TRAINER"] as const) {
        for (const permission of PERMISSION_KEYS) {
            const key = `${role}:${permission}`;
            if (existing.has(key)) continue;
            missing.push({
                role,
                permission,
                allowed: DEFAULT_PERMISSION_MATRIX[role][permission],
            });
        }
    }

    if (missing.length > 0) {
        await prisma.rolePermission.createMany({
            data: missing,
            skipDuplicates: true,
        });
    }
}

export async function getPermissionMatrix() {
    await ensurePermissionDefaults();
    const rows = await prisma.rolePermission.findMany({ where: { role: { in: ["STUDENT", "TRAINER"] } } });
    return normalizeMatrix(rows as Array<{ role: PermissionRole; permission: string; allowed: boolean }>);
}

export async function setRolePermission(role: PermissionRole, permission: PermissionKey, allowed: boolean) {
    if (role === "ADMIN") {
        throw HttpError.badRequest("Admin permissions are fixed and always allowed");
    }

    await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        create: { role, permission, allowed },
        update: { allowed },
    });

    return getPermissionMatrix();
}

export async function resetRolePermissions() {
    await prisma.rolePermission.deleteMany({ where: { role: { in: ["STUDENT", "TRAINER"] } } });

    const data: Array<{ role: PermissionRole; permission: PermissionKey; allowed: boolean }> = [];
    for (const role of ["STUDENT", "TRAINER"] as const) {
        for (const permission of PERMISSION_KEYS) {
            data.push({
                role,
                permission,
                allowed: DEFAULT_PERMISSION_MATRIX[role][permission],
            });
        }
    }

    await prisma.rolePermission.createMany({ data });

    return getPermissionMatrix();
}

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

export async function verifyTrainer(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { trainerProfile: true } });
    if (!user) throw HttpError.notFound("User not found");
    if (user.role !== "TRAINER") throw HttpError.badRequest("User is not a trainer");

    const profile = await prisma.trainerProfile.upsert({
        where: { userId },
        create: { userId, isVerified: true },
        update: { isVerified: true },
    });

    return { userId, isVerified: profile.isVerified };
}

export async function assignTrainerToStudent(studentId: string, trainerId: string | null) {
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, role: true } });
    if (!student || student.role !== "STUDENT") {
        throw HttpError.badRequest("Student not found");
    }

    if (trainerId) {
        const trainer = await prisma.user.findUnique({ where: { id: trainerId }, select: { id: true, role: true } });
        if (!trainer || trainer.role !== "TRAINER") {
            throw HttpError.badRequest("Trainer not found");
        }
    }

    const updated = await prisma.studentProfile.upsert({
        where: { userId: studentId },
        create: { userId: studentId, trainerId },
        update: { trainerId },
    });

    return { userId: updated.userId, trainerId: updated.trainerId };
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
    const createdNotification = await prisma.notification.create({
        data: {
            userId: post.userId,
            type: "system",
            title: status === "hidden" ? "Post Hidden" : "Post Reviewed",
            message: status === "hidden"
                ? "Your post has been hidden by a moderator for review."
                : "Your post has been reviewed and is now visible.",
        },
    });

    publishUserEvent(post.userId, "notification.created", {
        notificationId: createdNotification.id,
        type: createdNotification.type,
        title: createdNotification.title,
        createdAt: createdNotification.createdAt.toISOString(),
    });

    return updated;
}

export async function deletePostAdmin(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw HttpError.notFound("Post not found");
    await prisma.post.delete({ where: { id: postId } });

    const createdNotification = await prisma.notification.create({
        data: {
            userId: post.userId,
            type: "system",
            title: "Post Removed",
            message: "A post of yours was removed for violating community guidelines.",
        },
    });

    publishUserEvent(post.userId, "notification.created", {
        notificationId: createdNotification.id,
        type: createdNotification.type,
        title: createdNotification.title,
        createdAt: createdNotification.createdAt.toISOString(),
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
