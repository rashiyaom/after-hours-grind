#!/usr/bin/env node

const BASE_URL = process.env.LOAD_BASE_URL || "http://127.0.0.1:4000/api";
const PROFILE = process.env.LOAD_PROFILE || "burst";
const VIRTUAL_USERS = Number(process.env.LOAD_VUS || 50);
const ROUNDS = Number(process.env.LOAD_ROUNDS || 4);
const LOGIN_SAMPLE_USERS = Number(process.env.LOAD_LOGIN_USERS || 20);
const SESSION_POOL_SIZE = Number(process.env.LOAD_SESSION_POOL || VIRTUAL_USERS);
const TIMEOUT_MS = Number(process.env.LOAD_TIMEOUT_MS || 15000);
const BURST_READ_TIMEOUT_MS = Number(process.env.LOAD_BURST_TIMEOUT_MS || TIMEOUT_MS);
const MUTATION_TIMEOUT_MS = Number(process.env.LOAD_MUTATION_TIMEOUT_MS || 30000);
const THINK_TIME_MIN_MS = Number(process.env.LOAD_THINK_MIN_MS || 250);
const THINK_TIME_MAX_MS = Number(process.env.LOAD_THINK_MAX_MS || 900);
const TRAINER_APPROVE_BATCH = Number(process.env.LOAD_TRAINER_APPROVE_BATCH || 10);
const STUDENT_PLAN_PATH = process.env.LOAD_STUDENT_PLAN_PATH || "/student/plan/today";

const STUDENT_CREDENTIALS = Array.from({ length: VIRTUAL_USERS }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return { email: `load.student${num}@ahg.com`, password: "password123" };
});

const TRAINER_CREDENTIALS = { email: "trainer@ahg.com", password: "password123" };

const METRICS = new Map();

function ensureMetric(flow) {
  if (!METRICS.has(flow)) {
    METRICS.set(flow, {
      total: 0,
      ok: 0,
      fail: 0,
      statusCounts: new Map(),
      durationsMs: [],
    });
  }
  return METRICS.get(flow);
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function pushMetric(flow, status, durationMs, ok) {
  const metric = ensureMetric(flow);
  metric.total += 1;
  if (ok) {
    metric.ok += 1;
  } else {
    metric.fail += 1;
  }
  metric.durationsMs.push(durationMs);
  const key = String(status);
  metric.statusCounts.set(key, (metric.statusCounts.get(key) || 0) + 1);
}

function splitSetCookieHeader(header) {
  if (!header) return [];
  return header.split(/,(?=\s*[a-zA-Z0-9_\-]+=)/g).map((part) => part.trim()).filter(Boolean);
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  setFromResponse(response) {
    let setCookies = [];
    if (typeof response.headers.getSetCookie === "function") {
      setCookies = response.headers.getSetCookie();
    } else {
      setCookies = splitSetCookieHeader(response.headers.get("set-cookie"));
    }

    for (const entry of setCookies) {
      const first = entry.split(";")[0];
      const eqIdx = first.indexOf("=");
      if (eqIdx <= 0) continue;
      const name = first.slice(0, eqIdx).trim();
      const value = first.slice(eqIdx + 1).trim();
      this.cookies.set(name, value);
    }
  }

  toHeader() {
    if (!this.cookies.size) return "";
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  get(name) {
    return this.cookies.get(name);
  }
}

async function request(flow, jar, path, { method = "GET", body, expected = [200] } = {}) {
  const controller = new AbortController();
  const readTimeoutMs = PROFILE === "burst" ? BURST_READ_TIMEOUT_MS : TIMEOUT_MS;
  const timeoutMs = method === "GET" || method === "HEAD" ? readTimeoutMs : MUTATION_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const headers = {
      "Content-Type": "application/json",
    };
    const cookie = jar?.toHeader();
    if (cookie) headers.Cookie = cookie;

    if (method !== "GET" && method !== "HEAD") {
      const csrf = jar?.get("csrfToken");
      if (csrf) headers["x-csrf-token"] = csrf;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    jar?.setFromResponse(res);

    const durationMs = performance.now() - started;
    const ok = expected.includes(res.status);
    pushMetric(flow, res.status, durationMs, ok);

    let payload = null;
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    return { status: res.status, ok, payload };
  } catch (error) {
    const durationMs = performance.now() - started;
    pushMetric(flow, "ERR", durationMs, false);
    return { status: "ERR", ok: false, payload: { message: error?.message || "Request failed" } };
  } finally {
    clearTimeout(timeout);
  }
}

function makeStudentCredential(index) {
  return STUDENT_CREDENTIALS[index % STUDENT_CREDENTIALS.length];
}

async function loginAndWarmSession(credential) {
  const jar = new CookieJar();
  const login = await request("auth.login", jar, "/auth/login", {
    method: "POST",
    body: credential,
    expected: [200],
  });
  if (!login.ok) return { jar, userId: null };

  const me = await request("auth.me", jar, "/me", { method: "GET", expected: [200] });
  const refresh = await request("auth.refresh", jar, "/auth/refresh", {
    method: "POST",
    expected: [200],
  });

  const userId = me.ok && me.payload && typeof me.payload === "object" ? me.payload.id || null : null;
  return { jar, userId, healthy: me.ok && refresh.ok };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomThinkMs() {
  const spread = Math.max(0, THINK_TIME_MAX_MS - THINK_TIME_MIN_MS);
  return THINK_TIME_MIN_MS + Math.floor(Math.random() * (spread + 1));
}

let trainerSession = null;

async function runAuthPhase() {
  for (let i = 0; i < LOGIN_SAMPLE_USERS; i += 1) {
    const credential = makeStudentCredential(i);
    await loginAndWarmSession(credential);
    await sleep(120);
  }
}

async function runStudentReadFlows(vuIndex, sessionPool) {
  const poolEntry = sessionPool[vuIndex % sessionPool.length];
  if (!poolEntry?.healthy) return;
  const jar = poolEntry.jar;

    await request("student.plan.today", jar, STUDENT_PLAN_PATH, { method: "GET", expected: [200] });
  if (PROFILE === "paced") await sleep(randomThinkMs());

  await request("student.progress", jar, "/progress", { method: "GET", expected: [200] });
  if (PROFILE === "paced") await sleep(randomThinkMs());

  const planRes = await request("student.plan.today", jar, STUDENT_PLAN_PATH, { method: "GET", expected: [200] });
  const planPayload = planRes.payload && typeof planRes.payload === "object" ? planRes.payload : null;
  const todaysTasks = Array.isArray(planPayload?.todaysTasks) ? planPayload.todaysTasks : [];
  const targetTask = todaysTasks.find((task) => task && task.id && task.submissionStatus === "NOT_SUBMITTED") || todaysTasks[0];

  if (targetTask?.id) {
    await request("student.submission.create", jar, "/submissions", {
      method: "POST",
      body: {
        planTaskId: targetTask.id,
        studentNote: `load-test vu-${vuIndex}`,
      },
      expected: [201, 400, 403],
    });
  } else if (planRes.status === 200) {
    pushMetric("student.submission.create", "SKIP", 0, false);
  } else {
    pushMetric("student.submission.create", "SKIP", 0, false);
  }
}

async function runTrainerFlows() {
  if (!trainerSession?.healthy) return;
  const jar = trainerSession.jar;

  const listRes = await request("trainer.submissions.list", jar, "/submissions", {
    method: "GET",
    expected: [200],
  });

  if (!listRes.ok || !Array.isArray(listRes.payload)) {
    pushMetric("trainer.submission.approve", "SKIP", 0, true);
    return;
  }

  const pendingEntries = listRes.payload.filter((entry) => entry && entry.id && entry.status === "PENDING");
  if (!pendingEntries.length) {
    pushMetric("trainer.submission.approve", "SKIP", 0, true);
    return;
  }

  const subset = pendingEntries.slice(0, Math.max(1, TRAINER_APPROVE_BATCH));
  await Promise.all(
    subset.map((entry) =>
      request("trainer.submission.approve", jar, `/submissions/${entry.id}/approve`, {
        method: "POST",
        body: { note: "Approved by load test" },
        expected: [200, 400, 403, 404],
      })
    )
  );
}

async function buildSessionPool() {
  const pool = [];
  trainerSession = await loginAndWarmSession(TRAINER_CREDENTIALS);

  for (let i = 0; i < SESSION_POOL_SIZE; i += 1) {
    const credential = makeStudentCredential(i);
    const session = await loginAndWarmSession(credential);
    pool.push(session);
    await sleep(100);
  }
  if (!pool.length) {
    throw new Error("No student sessions were created for load phase");
  }
  return pool;
}

async function runMainLoadPhase(sessionPool) {
  if (PROFILE === "paced") {
    const pacedUsers = [];
    for (let vu = 0; vu < VIRTUAL_USERS; vu += 1) {
      pacedUsers.push((async () => {
        for (let round = 0; round < ROUNDS; round += 1) {
          await runStudentReadFlows(vu, sessionPool);
          await sleep(randomThinkMs());
        }
      })());
    }
    await Promise.all([...pacedUsers, runTrainerFlows()]);
    return;
  }

  const tasks = [];
  for (let round = 0; round < ROUNDS; round += 1) {
    for (let vu = 0; vu < VIRTUAL_USERS; vu += 1) {
      tasks.push(runStudentReadFlows(vu, sessionPool));
    }
    tasks.push(runTrainerFlows());
  }
  await Promise.all(tasks);
}

function summarizeAndPrint() {
  const coreFlows = [
    "auth.login",
    "auth.refresh",
    "auth.me",
    "student.plan.today",
    "student.progress",
    "student.submission.create",
    "trainer.submissions.list",
    "trainer.submission.approve",
  ];

  const summary = [];
  for (const flow of coreFlows) {
    const metric = ensureMetric(flow);
    const passRate = metric.total ? (metric.ok / metric.total) * 100 : 0;
    const p95 = percentile(metric.durationsMs, 95);
    const fail = passRate >= 95 ? "PASS" : "FAIL";
    const statuses = [...metric.statusCounts.entries()]
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([status, count]) => `${status}:${count}`)
      .join(", ");

    summary.push({
      flow,
      result: fail,
      total: metric.total,
      ok: metric.ok,
      failed: metric.fail,
      passRate: passRate.toFixed(1),
      p95Ms: p95 === null ? "n/a" : p95.toFixed(1),
      statuses,
    });
  }

  const header = {
    baseUrl: BASE_URL,
    profile: PROFILE,
    virtualUsers: VIRTUAL_USERS,
    rounds: ROUNDS,
    authSampleUsers: LOGIN_SAMPLE_USERS,
    sessionPoolSize: SESSION_POOL_SIZE,
    thinkTimeMinMs: THINK_TIME_MIN_MS,
    thinkTimeMaxMs: THINK_TIME_MAX_MS,
    trainerApproveBatch: TRAINER_APPROVE_BATCH,
        trainerApproveBatch: TRAINER_APPROVE_BATCH,
        burstReadTimeoutMs: BURST_READ_TIMEOUT_MS,
        studentPlanPath: STUDENT_PLAN_PATH,
    mutationTimeoutMs: MUTATION_TIMEOUT_MS,
  };

  console.log("LOAD_TEST_HEADER", JSON.stringify(header));
  console.log("LOAD_TEST_SUMMARY", JSON.stringify(summary));
}

async function main() {
  console.log(`Starting ${PROFILE} load test against ${BASE_URL} with ${VIRTUAL_USERS} VUs and ${ROUNDS} rounds...`);
  await runAuthPhase();
  const sessionPool = await buildSessionPool();
  await runMainLoadPhase(sessionPool);
  summarizeAndPrint();
}

main().catch((error) => {
  console.error("Load test crashed:", error);
  process.exitCode = 1;
});
