import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";
import { randomUUID } from "node:crypto";
import { getSmartPlanExerciseTemplateSeeds } from "../plans/personalizedPlan.js";

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

const ensureExerciseTemplateTables = async () => {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS exercise_template (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'general',
            sets INTEGER,
            reps INTEGER,
            rest_seconds INTEGER,
            duration_minutes INTEGER,
            difficulty TEXT NOT NULL DEFAULT 'moderate',
            equipment TEXT NOT NULL DEFAULT 'basic',
            youtube_url TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS exercise_template_assignment (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
            template_id TEXT NOT NULL REFERENCES exercise_template("id") ON DELETE CASCADE,
            day_number INTEGER NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(student_id, day_number, sort_order)
        );
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE exercise_template_assignment
        ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1;
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'exercise_template_assignment_student_id_day_number_key'
            ) THEN
                ALTER TABLE exercise_template_assignment
                DROP CONSTRAINT exercise_template_assignment_student_id_day_number_key;
            END IF;
        END $$;
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS exercise_template_assignment_student_day_sort_idx
        ON exercise_template_assignment(student_id, day_number, sort_order);
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS exercise_template_assignment_student_day_idx
        ON exercise_template_assignment(student_id, day_number);
    `);

    const existingRows = await prisma.$queryRawUnsafe<Array<{ name: string; category: string }>>(`
        SELECT name, category
        FROM exercise_template
    `);
    const existingKeySet = new Set(
        existingRows.map((row) => `${String(row.name).toLowerCase()}::${String(row.category).toLowerCase()}`),
    );

    const seeds = getSmartPlanExerciseTemplateSeeds();
    for (const seed of seeds) {
        const dedupeKey = `${seed.name.toLowerCase()}::${seed.category.toLowerCase()}`;
        if (existingKeySet.has(dedupeKey)) {
            continue;
        }

        await prisma.$executeRawUnsafe(
            `
                INSERT INTO exercise_template (
                    id,
                    name,
                    description,
                    category,
                    sets,
                    reps,
                    rest_seconds,
                    duration_minutes,
                    difficulty,
                    equipment,
                    youtube_url,
                    is_active
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            `,
            randomUUID(),
            seed.name,
            seed.description,
            seed.category,
            seed.sets,
            seed.reps,
            seed.restSeconds,
            seed.durationMinutes,
            seed.difficulty,
            seed.equipment,
            null,
            true,
        );

        existingKeySet.add(dedupeKey);
    }
};

type TemplateAssignmentRow = {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    duration_minutes: number | null;
    sets: number | null;
    reps: number | null;
    rest_seconds: number | null;
    youtube_url: string | null;
    sort_order: number;
};

const buildWorkoutDescriptionFromTemplate = (template: {
    description?: string | null;
    sets?: number | null;
    reps?: number | null;
    rest_seconds?: number | null;
    youtube_url?: string | null;
}) => {
    const detailParts = [
        String(template.description ?? "").trim(),
        template.sets ? `Sets: ${Number(template.sets)}` : "",
        template.reps ? `Reps: ${Number(template.reps)}` : "",
        template.rest_seconds ? `Rest: ${Number(template.rest_seconds)}s` : "",
        template.youtube_url ? `Video: ${String(template.youtube_url)}` : "",
    ].filter(Boolean);

    return detailParts.join(" | ");
};

const syncPlanDayWorkoutsFromAssignments = async (studentId: string, dayNumber: number) => {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!profile?.currentPlanId) {
        return false;
    }

    const day = await prisma.planDay.findUnique({
        where: { planId_day: { planId: profile.currentPlanId, day: dayNumber } },
    });

    if (!day) {
        return false;
    }

    const assignedTemplates = await prisma.$queryRawUnsafe<Array<TemplateAssignmentRow>>(
        `
            SELECT
                t.id,
                t.name,
                t.description,
                t.difficulty,
                t.duration_minutes,
                t.sets,
                t.reps,
                t.rest_seconds,
                t.youtube_url,
                a.sort_order
            FROM exercise_template_assignment a
            JOIN exercise_template t ON t.id = a.template_id
            WHERE a.student_id = $1
              AND a.day_number = $2
              AND t.is_active = TRUE
            ORDER BY a.sort_order ASC, a.created_at ASC
        `,
        studentId,
        dayNumber,
    );

    if (assignedTemplates.length === 0) {
        return false;
    }

    await prisma.planTask.deleteMany({ where: { planDayId: day.id, type: "workout" } });

    for (const template of assignedTemplates) {
        await prisma.planTask.create({
            data: {
                planDayId: day.id,
                type: "workout",
                title: `${template.sort_order}. ${template.name}`,
                description: buildWorkoutDescriptionFromTemplate(template),
                durationMin: Number(template.duration_minutes ?? 30),
                intensity: String(template.difficulty ?? "moderate"),
                points: 45,
            },
        });
    }

    return true;
};

export async function getExerciseTemplates() {
    await ensureExerciseTemplateTables();
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT
            id,
            name,
            description,
            category,
            sets,
            reps,
            rest_seconds AS "restSeconds",
            duration_minutes AS "durationMinutes",
            difficulty,
            equipment,
            youtube_url AS "youtubeUrl",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        FROM exercise_template
        ORDER BY created_at DESC
    `);
    return rows;
}

export async function createExerciseTemplate(input: {
    name: string;
    description?: string;
    category?: string;
    sets?: number | null;
    reps?: number | null;
    restSeconds?: number | null;
    durationMinutes?: number | null;
    difficulty?: string;
    equipment?: string;
    youtubeUrl?: string | null;
    isActive?: boolean;
}) {
    await ensureExerciseTemplateTables();

    const id = randomUUID();
    await prisma.$executeRawUnsafe(
        `
            INSERT INTO exercise_template (
                id,
                name,
                description,
                category,
                sets,
                reps,
                rest_seconds,
                duration_minutes,
                difficulty,
                equipment,
                youtube_url,
                is_active
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `,
        id,
        input.name,
        input.description ?? "",
        input.category ?? "general",
        input.sets ?? null,
        input.reps ?? null,
        input.restSeconds ?? null,
        input.durationMinutes ?? null,
        input.difficulty ?? "moderate",
        input.equipment ?? "basic",
        input.youtubeUrl ?? null,
        input.isActive ?? true,
    );

    const [created] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `
            SELECT
                id,
                name,
                description,
                category,
                sets,
                reps,
                rest_seconds AS "restSeconds",
                duration_minutes AS "durationMinutes",
                difficulty,
                equipment,
                youtube_url AS "youtubeUrl",
                is_active AS "isActive",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM exercise_template
            WHERE id = $1
            LIMIT 1
        `,
        id,
    );

    return created;
}

export async function updateExerciseTemplate(
    templateId: string,
    input: {
        name?: string;
        description?: string;
        category?: string;
        sets?: number | null;
        reps?: number | null;
        restSeconds?: number | null;
        durationMinutes?: number | null;
        difficulty?: string;
        equipment?: string;
        youtubeUrl?: string | null;
        isActive?: boolean;
    }
) {
    await ensureExerciseTemplateTables();

    await prisma.$executeRawUnsafe(
        `
            UPDATE exercise_template
            SET
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                category = COALESCE($4, category),
                sets = COALESCE($5, sets),
                reps = COALESCE($6, reps),
                rest_seconds = COALESCE($7, rest_seconds),
                duration_minutes = COALESCE($8, duration_minutes),
                difficulty = COALESCE($9, difficulty),
                equipment = COALESCE($10, equipment),
                youtube_url = COALESCE($11, youtube_url),
                is_active = COALESCE($12, is_active),
                updated_at = NOW()
            WHERE id = $1
        `,
        templateId,
        input.name ?? null,
        input.description ?? null,
        input.category ?? null,
        input.sets ?? null,
        input.reps ?? null,
        input.restSeconds ?? null,
        input.durationMinutes ?? null,
        input.difficulty ?? null,
        input.equipment ?? null,
        input.youtubeUrl ?? null,
        input.isActive ?? null,
    );

    const [updated] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `
            SELECT
                id,
                name,
                description,
                category,
                sets,
                reps,
                rest_seconds AS "restSeconds",
                duration_minutes AS "durationMinutes",
                difficulty,
                equipment,
                youtube_url AS "youtubeUrl",
                is_active AS "isActive",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM exercise_template
            WHERE id = $1
            LIMIT 1
        `,
        templateId,
    );

    if (!updated) {
        throw HttpError.notFound("Exercise template not found");
    }

    return updated;
}

export async function deleteExerciseTemplate(templateId: string) {
    await ensureExerciseTemplateTables();
    await prisma.$executeRawUnsafe(`DELETE FROM exercise_template WHERE id = $1`, templateId);
    return { deleted: true };
}

export async function getExerciseTemplateAssignments() {
    await ensureExerciseTemplateTables();
    return prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT
            a.id,
            a.student_id AS "studentId",
            u.name AS "studentName",
            a.template_id AS "templateId",
            t.name AS "templateName",
            a.day_number AS "dayNumber",
            a.sort_order AS "sortOrder",
            a.created_at AS "createdAt",
            a.updated_at AS "updatedAt"
        FROM exercise_template_assignment a
        JOIN "User" u ON u.id = a.student_id
        JOIN exercise_template t ON t.id = a.template_id
        ORDER BY a.updated_at DESC, a.sort_order ASC
    `);
}

export async function assignExerciseTemplate(payload: {
    templateId: string;
    studentIds: string[];
    dayNumber: number;
    sortOrder?: number;
}) {
    await ensureExerciseTemplateTables();

    const [template] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `
            SELECT id, name, description, sets, reps, rest_seconds, duration_minutes, difficulty, equipment, youtube_url, is_active
            FROM exercise_template
            WHERE id = $1
            LIMIT 1
        `,
        payload.templateId,
    );

    if (!template || template.is_active === false) {
        throw HttpError.notFound("Active exercise template not found");
    }

    const summary: Array<{ studentId: string; appliedToPlan: boolean; sortOrder: number }> = [];

    for (const studentId of payload.studentIds) {
        const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, role: true, name: true } });
        if (!student || student.role !== "STUDENT") {
            continue;
        }

        await prisma.$executeRawUnsafe(
            `
                DELETE FROM exercise_template_assignment
                WHERE student_id = $1
                  AND day_number = $2
                  AND template_id = $3
            `,
            studentId,
            payload.dayNumber,
            payload.templateId,
        );

        let resolvedSortOrder = payload.sortOrder && payload.sortOrder > 0 ? Math.floor(payload.sortOrder) : null;
        if (resolvedSortOrder) {
            await prisma.$executeRawUnsafe(
                `
                    UPDATE exercise_template_assignment
                    SET sort_order = sort_order + 1,
                        updated_at = NOW()
                    WHERE student_id = $1
                      AND day_number = $2
                      AND sort_order >= $3
                `,
                studentId,
                payload.dayNumber,
                resolvedSortOrder,
            );
        } else {
            const [maxRow] = await prisma.$queryRawUnsafe<Array<{ max_order: number | null }>>(
                `
                    SELECT MAX(sort_order) AS max_order
                    FROM exercise_template_assignment
                    WHERE student_id = $1
                      AND day_number = $2
                `,
                studentId,
                payload.dayNumber,
            );
            resolvedSortOrder = Number(maxRow?.max_order ?? 0) + 1;
        }

        await prisma.$executeRawUnsafe(
            `
                INSERT INTO exercise_template_assignment (id, student_id, template_id, day_number, sort_order)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (student_id, day_number, sort_order)
                DO UPDATE SET
                    template_id = EXCLUDED.template_id,
                    updated_at = NOW()
            `,
            randomUUID(),
            studentId,
            payload.templateId,
            payload.dayNumber,
            resolvedSortOrder,
        );

        let appliedToPlan = false;
        appliedToPlan = await syncPlanDayWorkoutsFromAssignments(studentId, payload.dayNumber);

        const createdNotification = await prisma.notification.create({
            data: {
                userId: studentId,
                type: "plan",
                title: "Workout Updated",
                message: `Day ${payload.dayNumber} workout sequence updated by admin.`,
            },
        });

        publishUserEvent(studentId, "notification.created", {
            notificationId: createdNotification.id,
            type: createdNotification.type,
            title: createdNotification.title,
            createdAt: createdNotification.createdAt.toISOString(),
        });

        summary.push({ studentId, appliedToPlan, sortOrder: resolvedSortOrder });
    }

    return {
        templateId: payload.templateId,
        dayNumber: payload.dayNumber,
        assignments: summary,
    };
}

export async function assignExerciseTemplateBulk(payload: {
    studentIds: string[];
    dayPlans: Array<{
        dayNumber: number;
        templateIds: string[];
    }>;
}) {
    await ensureExerciseTemplateTables();

    const normalizedDayPlans = payload.dayPlans
        .map((plan) => ({
            dayNumber: Math.floor(plan.dayNumber),
            templateIds: Array.from(new Set(plan.templateIds.filter((templateId) => templateId.trim().length > 0))),
        }))
        .filter((plan) => plan.dayNumber >= 1 && plan.dayNumber <= 60);

    if (normalizedDayPlans.length === 0) {
        throw HttpError.badRequest("At least one day plan is required");
    }

    const allTemplateIds = Array.from(new Set(normalizedDayPlans.flatMap((plan) => plan.templateIds)));
    if (allTemplateIds.length === 0) {
        throw HttpError.badRequest("At least one template must be assigned");
    }

    const templateRows = await prisma.$queryRawUnsafe<Array<{ id: string; is_active: boolean }>>(
        `
            SELECT id, is_active
            FROM exercise_template
            WHERE id = ANY($1::text[])
        `,
        allTemplateIds,
    );

    const activeTemplateIds = new Set(templateRows.filter((row) => row.is_active).map((row) => row.id));
    const missingTemplateId = allTemplateIds.find((templateId) => !activeTemplateIds.has(templateId));
    if (missingTemplateId) {
        throw HttpError.badRequest(`Template ${missingTemplateId} is not active or does not exist`);
    }

    const validStudents = await prisma.user.findMany({
        where: { id: { in: payload.studentIds }, role: "STUDENT" },
        select: { id: true },
    });

    if (validStudents.length === 0) {
        throw HttpError.badRequest("No valid students found for assignment");
    }

    let totalRows = 0;
    let appliedToPlanCount = 0;

    for (const student of validStudents) {
        for (const dayPlan of normalizedDayPlans) {
            await prisma.$executeRawUnsafe(
                `
                    DELETE FROM exercise_template_assignment
                    WHERE student_id = $1
                      AND day_number = $2
                `,
                student.id,
                dayPlan.dayNumber,
            );

            for (let index = 0; index < dayPlan.templateIds.length; index += 1) {
                await prisma.$executeRawUnsafe(
                    `
                        INSERT INTO exercise_template_assignment (id, student_id, template_id, day_number, sort_order)
                        VALUES ($1, $2, $3, $4, $5)
                    `,
                    randomUUID(),
                    student.id,
                    dayPlan.templateIds[index],
                    dayPlan.dayNumber,
                    index + 1,
                );
                totalRows += 1;
            }

            const applied = await syncPlanDayWorkoutsFromAssignments(student.id, dayPlan.dayNumber);
            if (applied) {
                appliedToPlanCount += 1;
            }
        }

        const createdNotification = await prisma.notification.create({
            data: {
                userId: student.id,
                type: "plan",
                title: "Cycle Plan Updated",
                message: "Your upcoming day-wise workout sequence was updated by admin.",
            },
        });

        publishUserEvent(student.id, "notification.created", {
            notificationId: createdNotification.id,
            type: createdNotification.type,
            title: createdNotification.title,
            createdAt: createdNotification.createdAt.toISOString(),
        });
    }

    return {
        studentsUpdated: validStudents.length,
        daysUpdated: normalizedDayPlans.length,
        assignmentRows: totalRows,
        appliedToPlanCount,
    };
}
