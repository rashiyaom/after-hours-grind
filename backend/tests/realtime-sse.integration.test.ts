import { createServer, type Server } from "http";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { publishUserEvent } from "../src/lib/realtime.js";

const mockVerifyAccessToken = vi.fn();

vi.mock("../src/lib/jwt.js", async () => {
  const actual = await vi.importActual<typeof import("../src/lib/jwt.js")>("../src/lib/jwt.js");
  return {
    ...actual,
    verifyAccessToken: (...args: Parameters<typeof actual.verifyAccessToken>) => mockVerifyAccessToken(...args),
  };
});

let app: Awaited<ReturnType<typeof importApp>>;

async function importApp() {
  const mod = await import("../src/app.js");
  return mod.default;
}

async function startServer(): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not resolve test server address");
  }

  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe("backend integration: realtime sse", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret-123456";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-123456";
    app = await importApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams chat and notification events to authenticated user", async () => {
    mockVerifyAccessToken.mockReturnValue({ userId: "student-1", role: "STUDENT" });

    const { server, baseUrl } = await startServer();
    const controller = new AbortController();
    const decoder = new TextDecoder();
    const receivedEvents = new Set<string>();

    try {
      const response = await fetch(`${baseUrl}/api/stream/events`, {
        method: "GET",
        headers: { Authorization: "Bearer fake-token" },
        signal: controller.signal,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type") ?? "").toContain("text/event-stream");
      expect(response.body).toBeTruthy();

      const done = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out waiting for SSE events"));
        }, 5000);

        let buffer = "";
        let currentEvent = "";
        let published = false;

        const maybeResolve = () => {
          if (
            receivedEvents.has("ready") &&
            receivedEvents.has("chat.message") &&
            receivedEvents.has("notification.created")
          ) {
            clearTimeout(timeout);
            resolve();
          }
        };

        const parseLine = (line: string) => {
          if (line.startsWith("event:")) {
            currentEvent = line.slice("event:".length).trim();
            if (currentEvent) {
              receivedEvents.add(currentEvent);
              if (currentEvent === "ready" && !published) {
                published = true;
                publishUserEvent("student-1", "chat.message", {
                  threadId: "thread-1",
                  messageId: "message-1",
                  senderId: "trainer-1",
                });
                publishUserEvent("student-1", "notification.created", {
                  notificationId: "notif-1",
                  title: "Submission Approved",
                });
              }
              maybeResolve();
            }
            return;
          }

          if (line.startsWith("data:")) {
            maybeResolve();
          }
        };

        const read = async () => {
          const reader = response.body!.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const rawLine of lines) {
              parseLine(rawLine.replace(/\r$/, ""));
            }
          }
        };

        read().catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      await done;
      expect(receivedEvents.has("ready")).toBe(true);
      expect(receivedEvents.has("chat.message")).toBe(true);
      expect(receivedEvents.has("notification.created")).toBe(true);
    } finally {
      controller.abort();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
