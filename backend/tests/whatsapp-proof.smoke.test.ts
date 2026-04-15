import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPublishUserEvent = vi.fn();

const mockPrisma = {
  studentProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  planTask: {
    findUnique: vi.fn(),
  },
  trainerProfile: {
    findUnique: vi.fn(),
  },
  submission: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("../src/config/prisma.js", () => ({
  prisma: mockPrisma,
}));

vi.mock("../src/lib/realtime.js", () => ({
  publishUserEvent: (...args: unknown[]) => mockPublishUserEvent(...args),
}));

vi.mock("../src/config/env.js", () => ({
  env: {
    REFRESH_TOKEN_TTL: "7d",
    DEFAULT_TRAINER_WHATSAPP_NUMBER: "+919999999999",
  },
}));

vi.mock("../src/lib/password.js", () => ({
  hashPassword: vi.fn(async () => "hashed-password"),
  verifyPassword: vi.fn(),
}));

vi.mock("../src/lib/jwt.js", () => ({
  signAccessToken: vi.fn(() => "access-token"),
  signRefreshToken: vi.fn(() => "refresh-token"),
  verifyRefreshToken: vi.fn(),
}));

describe("whatsapp flow smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("student submission returns WhatsApp URL and creates pending proof record", async () => {
    const { createSubmission } = await import("../src/modules/plans/plans.service.js");

    const createdAt = new Date();
    const plan = {
      id: "plan-1",
      name: "25 Day Smart Plan",
      createdAt,
      days: [
        {
          day: 1,
          tasks: [{ id: "task-1" }],
        },
      ],
    };

    mockPrisma.studentProfile.findUnique.mockResolvedValue({
      userId: "student-1",
      currentPlanId: "plan-1",
      trainerId: "trainer-1",
    });

    mockPrisma.planTask.findUnique.mockResolvedValue({
      id: "task-1",
      title: "Upload weighing scale image",
      type: "checkin",
      planDay: {
        day: 1,
        planId: "plan-1",
        plan,
      },
    });

    mockPrisma.trainerProfile.findUnique.mockResolvedValue({
      userId: "trainer-1",
      whatsappNumber: "+919876543210",
    });

    mockPrisma.submission.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({ name: "Student One" });

    mockPrisma.submission.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "submission-1",
      studentId: "student-1",
      planTaskId: "task-1",
      mediaUrl: String(data.mediaUrl),
      status: "PENDING",
      trainerNote: String(data.trainerNote ?? ""),
      createdAt: new Date(),
      student: { id: "student-1", name: "Student One" },
      planTask: {
        title: "Upload weighing scale image",
        type: "checkin",
        planDay: { day: 1 },
      },
    }));

    const result = await createSubmission("student-1", {
      planTaskId: "task-1",
      studentNote: "Uploaded on WhatsApp",
    });

    expect(result.status).toBe("PENDING");
    expect(result.proofRefId).toMatch(/^AHG-/);
    expect(result.whatsappUrl).toContain("https://wa.me/919876543210?text=");

    const createCall = mockPrisma.submission.create.mock.calls[0][0] as {
      data: { mediaUrl: string; trainerNote: string };
    };

    expect(createCall.data.mediaUrl).toMatch(/^whatsapp:\/\/proof\//);
    expect(createCall.data.trainerNote).toContain("Student note:");
  });

  it("trainer can approve or reject while keeping proof context", async () => {
    const { approveSubmission, rejectSubmission } = await import("../src/modules/plans/plans.service.js");

    const pendingSubmission = {
      id: "submission-1",
      studentId: "student-1",
      status: "PENDING",
      trainerNote: "Student note: Shared media over WhatsApp",
      planTaskId: "task-1",
      student: {
        studentProfile: { trainerId: "trainer-1" },
      },
    };

    const tx = {
      submission: {
        findUnique: vi.fn(async () => pendingSubmission),
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "submission-1",
          status: String(data.status),
          reviewedAt: new Date(),
        })),
      },
      planTask: {
        findUnique: vi.fn(async () => ({ id: "task-1", points: 15 })),
      },
      studentProfile: {
        update: vi.fn(async () => ({})),
      },
      notification: {
        create: vi.fn(async () => ({
          id: "notif-1",
          type: "trainer",
          title: "Submission Approved",
          createdAt: new Date(),
        })),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (cb: (trx: typeof tx) => Promise<unknown>) => cb(tx));

    await approveSubmission("trainer-1", "TRAINER", "submission-1", "Looks good");

    const approveUpdatePayload = tx.submission.update.mock.calls[0][0] as { data: { trainerNote: string } };
    expect(approveUpdatePayload.data.trainerNote).toContain("Student note:");
    expect(approveUpdatePayload.data.trainerNote).toContain("Trainer note:");

    mockPrisma.submission.findUnique.mockResolvedValue({
      ...pendingSubmission,
      student: { studentProfile: { trainerId: "trainer-1" } },
    });

    mockPrisma.submission.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "submission-1",
      status: String(data.status),
      reviewedAt: new Date(),
    }));

    mockPrisma.notification.create.mockResolvedValue({
      id: "notif-2",
      type: "trainer",
      title: "Submission Rejected",
      createdAt: new Date(),
    });

    await rejectSubmission("trainer-1", "TRAINER", "submission-1", "Please resend with clearer angle");

    const rejectUpdatePayload = mockPrisma.submission.update.mock.calls[0][0] as { data: { trainerNote: string } };
    expect(rejectUpdatePayload.data.trainerNote).toContain("Student note:");
    expect(rejectUpdatePayload.data.trainerNote).toContain("Trainer note:");
  });

  it("trainer signup requires and persists WhatsApp number", async () => {
    const { signupSchema } = await import("../src/modules/auth/auth.schema.js");
    const { signup } = await import("../src/modules/auth/auth.service.js");

    const withoutWhatsapp = signupSchema.safeParse({
      name: "Coach",
      email: "coach@example.com",
      password: "password123",
      role: "TRAINER",
      specialization: "Strength",
    });
    expect(withoutWhatsapp.success).toBe(false);

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: "trainer-1", role: "TRAINER" });
    mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1" });

    await signup({
      name: "Coach",
      email: "coach@example.com",
      password: "password123",
      role: "TRAINER",
      specialization: "Strength",
      whatsappNumber: "+919812345678",
    });

    const createPayload = mockPrisma.user.create.mock.calls[0][0] as {
      data: { trainerProfile?: { create?: { whatsappNumber?: string | null } } };
    };

    expect(createPayload.data.trainerProfile?.create?.whatsappNumber).toBe("+919812345678");
  });
});
