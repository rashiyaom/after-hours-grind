import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyAccessToken = vi.fn();
const mockGetStravaStatus = vi.fn();
const mockGetStravaConnectUrl = vi.fn();
const mockExchangeStravaCode = vi.fn();
const mockSyncStravaActivities = vi.fn();
const mockDisconnectStrava = vi.fn();

vi.mock("../src/lib/jwt.js", async () => {
  const actual = await vi.importActual<typeof import("../src/lib/jwt.js")>("../src/lib/jwt.js");
  return {
    ...actual,
    verifyAccessToken: (...args: Parameters<typeof actual.verifyAccessToken>) => mockVerifyAccessToken(...args),
  };
});

vi.mock("../src/modules/strava/strava.service.js", () => ({
  getStravaStatus: (...args: unknown[]) => mockGetStravaStatus(...args),
  getStravaConnectUrl: (...args: unknown[]) => mockGetStravaConnectUrl(...args),
  exchangeStravaCode: (...args: unknown[]) => mockExchangeStravaCode(...args),
  syncStravaActivities: (...args: unknown[]) => mockSyncStravaActivities(...args),
  disconnectStrava: (...args: unknown[]) => mockDisconnectStrava(...args),
}));

let app: Awaited<ReturnType<typeof importApp>>;

async function importApp() {
  const mod = await import("../src/app.js");
  return mod.default;
}

describe("backend integration: strava routes", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret-123456";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-123456";
    app = await importApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ userId: "student-1", role: "STUDENT" });
  });

  it("returns student strava status", async () => {
    mockGetStravaStatus.mockResolvedValue({
      connected: true,
      athleteDisplayName: "Om Rashiya",
      athleteUsername: "rashiyao",
      lastSyncAt: "2026-04-24T12:00:00.000Z",
    });

    const res = await request(app)
      .get("/api/strava/status")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(mockGetStravaStatus).toHaveBeenCalledWith("student-1");
  });

  it("returns connect url and sync response", async () => {
    mockGetStravaConnectUrl.mockResolvedValue({
      connectUrl: "https://www.strava.com/oauth/authorize?client_id=test",
    });
    mockSyncStravaActivities.mockResolvedValue({
      connected: true,
      importedCount: 3,
      fetchedCount: 10,
      lastSyncAt: "2026-04-24T12:01:00.000Z",
    });

    const connectRes = await request(app)
      .get("/api/strava/connect-url")
      .set("Authorization", "Bearer fake-token");

    expect(connectRes.status).toBe(200);
    expect(connectRes.body.connectUrl).toContain("strava.com/oauth/authorize");

    const syncRes = await request(app)
      .post("/api/strava/sync")
      .set("Authorization", "Bearer fake-token")
      .send({});

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.importedCount).toBe(3);
    expect(mockSyncStravaActivities).toHaveBeenCalledWith("student-1");
  });

  it("exchanges oauth code and disconnects", async () => {
    mockExchangeStravaCode.mockResolvedValue({
      connected: true,
      importedCount: 1,
      fetchedCount: 1,
      lastSyncAt: "2026-04-24T12:05:00.000Z",
    });
    mockDisconnectStrava.mockResolvedValue({ connected: false });

    const exchangeRes = await request(app)
      .post("/api/strava/exchange")
      .set("Authorization", "Bearer fake-token")
      .send({ code: "abc", state: "xyz" });

    expect(exchangeRes.status).toBe(201);
    expect(exchangeRes.body.importedCount).toBe(1);

    const disconnectRes = await request(app)
      .delete("/api/strava/connection")
      .set("Authorization", "Bearer fake-token");

    expect(disconnectRes.status).toBe(200);
    expect(disconnectRes.body.connected).toBe(false);
    expect(mockDisconnectStrava).toHaveBeenCalledWith("student-1");
  });

  it("blocks non-student roles", async () => {
    mockVerifyAccessToken.mockReturnValue({ userId: "trainer-1", role: "TRAINER" });

    const res = await request(app)
      .get("/api/strava/status")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not allowed/i);
  });
});
