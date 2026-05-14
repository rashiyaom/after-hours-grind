import { test, expect, type APIRequestContext } from "@playwright/test";

if (!process.env.SMOKE_STUDENT_EMAIL || !process.env.SMOKE_STUDENT_PASSWORD || !process.env.SMOKE_TRAINER_EMAIL || !process.env.SMOKE_TRAINER_PASSWORD) {
  throw new Error('Missing smoke test credentials. Set SMOKE_STUDENT_EMAIL, SMOKE_STUDENT_PASSWORD, SMOKE_TRAINER_EMAIL, SMOKE_TRAINER_PASSWORD in the environment to run runtime smoke tests.');
}
const STUDENT_EMAIL = process.env.SMOKE_STUDENT_EMAIL;
const STUDENT_PASSWORD = process.env.SMOKE_STUDENT_PASSWORD;
const TRAINER_EMAIL = process.env.SMOKE_TRAINER_EMAIL;
const TRAINER_PASSWORD = process.env.SMOKE_TRAINER_PASSWORD;

async function loginToken(request: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await request.post("http://localhost:4000/api/auth/login", {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { accessToken: string };
  return payload.accessToken;
}

test.describe.serial("runtime realtime smoke", () => {
  test.skip(
    process.env.RUN_RUNTIME_SMOKE !== "1",
    "Set RUN_RUNTIME_SMOKE=1 to run this live runtime smoke in a fully configured local environment.",
  );

  test("student submit -> trainer approve -> student reflects within one cycle", async ({ request }) => {
    test.setTimeout(120000);
    const studentToken = await loginToken(request, STUDENT_EMAIL, STUDENT_PASSWORD);
    const trainerToken = await loginToken(request, TRAINER_EMAIL, TRAINER_PASSWORD);

    // 1) Student submits task proof intent (WhatsApp flow).
    const todayResponse = await request.get("http://localhost:4000/api/student/plan/today", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(todayResponse.ok()).toBeTruthy();
    const todayPlan = (await todayResponse.json()) as {
      todaysTasks?: Array<{ id: string; type?: string; submissionStatus?: string }>;
    };

    const targetTask =
      todayPlan.todaysTasks?.find(
        (task) => (task.type === "workout" || task.type === "habit") && task.submissionStatus !== "APPROVED",
      ) ?? todayPlan.todaysTasks?.find((task) => task.submissionStatus !== "APPROVED");
    expect(targetTask?.id).toBeTruthy();

    const submitResponse = await request.post("http://localhost:4000/api/submissions", {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { planTaskId: targetTask!.id, studentNote: "runtime smoke" },
    });

    let submissionId: string | null = null;
    if (submitResponse.ok()) {
      submissionId = ((await submitResponse.json()) as { id: string }).id;
    } else {
      const listResponse = await request.get("http://localhost:4000/api/submissions", {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(listResponse.ok()).toBeTruthy();
      const submissions = (await listResponse.json()) as Array<{
        id: string;
        status: string;
        studentId?: string;
        planTask?: { id?: string };
      }>;
      const fallback = submissions.find(
        (submission) => submission.status === "PENDING" && submission.planTask?.id === targetTask!.id,
      );
      submissionId = fallback?.id ?? null;
    }
    expect(submissionId).toBeTruthy();

    // 2) Trainer approves submission.
    const approveResponse = await request.post(
      `http://localhost:4000/api/submissions/${submissionId}/approve`,
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
        data: { note: "runtime smoke approve" },
      },
    );
    expect(approveResponse.ok()).toBeTruthy();

    // 3) Student should see approved status within one refresh cycle.
    let reflectedStatus = "UNKNOWN";
    let reflected = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const currentResponse = await request.get("http://localhost:4000/api/student/plan/today", {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(currentResponse.ok()).toBeTruthy();
      const currentPlan = (await currentResponse.json()) as {
        todaysTasks?: Array<{ id: string; submissionStatus?: string }>;
      };
      reflectedStatus =
        currentPlan.todaysTasks?.find((task) => task.id === targetTask!.id)?.submissionStatus ?? "MISSING";
      if (reflectedStatus === "APPROVED") {
        reflected = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    expect(reflected, `Expected approved reflection within one cycle, got status=${reflectedStatus}`).toBeTruthy();
  });
});
