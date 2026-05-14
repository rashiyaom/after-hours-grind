import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/lib/httpError.js";

const mockVerifyAccessToken = vi.fn();
const mockGetMe = vi.fn();
const mockGetAllUsersAdmin = vi.fn();
const mockApproveSubmission = vi.fn();

vi.mock("../src/lib/jwt.js", async () => {
  const actual = await vi.importActual<typeof import("../src/lib/jwt.js")>("../src/lib/jwt.js");
  return {
    ...actual,
    verifyAccessToken: (...args: Parameters<typeof actual.verifyAccessToken>) => mockVerifyAccessToken(...args),
  };
});

vi.mock("../src/modules/users/users.service.js", () => ({
  getMe: (...args: unknown[]) => mockGetMe(...args),
  getUser: vi.fn(),
  updateMe: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getFeaturedAthletes: vi.fn(),
}));

vi.mock("../src/modules/admin/admin.service.js", () => ({
  getAllUsersAdmin: (...args: unknown[]) => mockGetAllUsersAdmin(...args),
  toggleUserBan: vi.fn(),
  updatePostModeration: vi.fn(),
  getActivityLogs: vi.fn(),
}));

vi.mock("../src/modules/plans/plans.service.js", () => ({
  getTodayPlan: vi.fn(),
  createSubmission: vi.fn(),
  approveSubmission: (...args: unknown[]) => mockApproveSubmission(...args),
  rejectSubmission: vi.fn(),
  createPlan: vi.fn(),
  getTrainerStudents: vi.fn(),
  getSubmissions: vi.fn(),
}));

let app: Awaited<ReturnType<typeof importApp>>;

async function importApp() {
  const mod = await import("../src/app.js");
  return mod.default;
}

describe("backend integration: auth, permission, ownership", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
    if (!process.env.DATABASE_URL || !process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error("Missing test environment. Set DATABASE_URL, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET.");
    }
    app = await importApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects protected route without auth token", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing authentication token/i);
  });

  it("rejects admin route for non-admin role", async () => {
    mockVerifyAccessToken.mockReturnValue({ userId: "student-1", role: "STUDENT" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not allowed/i);
  });

  it("enforces trainer ownership when approving submissions", async () => {
    mockVerifyAccessToken.mockReturnValue({ userId: "trainer-2", role: "TRAINER" });
    mockApproveSubmission.mockRejectedValue(
      HttpError.forbidden("You can only review submissions from your assigned students")
    );

    const res = await request(app)
      .post("/api/submissions/submission-1/approve")
      .set("Authorization", "Bearer fake-token")
      .send({ note: "Looks good" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/assigned students/i);
  });

  it("allows authenticated user to fetch self profile", async () => {
    mockVerifyAccessToken.mockReturnValue({ userId: "student-1", role: "STUDENT" });
    mockGetMe.mockResolvedValue({ id: "student-1", name: "Student" });

    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("student-1");
  });
});
