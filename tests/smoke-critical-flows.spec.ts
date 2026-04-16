import { test, expect } from "@playwright/test";

const APP_URL = process.env.SMOKE_BASE_URL;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "rashiyaom@gmail.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "Romashiya@123";
const STUDENT_EMAIL = process.env.SMOKE_STUDENT_EMAIL ?? "student1@ahg.com";
const STUDENT_PASSWORD = process.env.SMOKE_STUDENT_PASSWORD ?? "password123";

async function login(page: Parameters<typeof test>[0]["page"], email: string, password: string) {
  await page.goto(APP_URL ? `${APP_URL}/login` : "/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign In" }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();
  await page.waitForTimeout(1500);
}

test.describe.serial("critical smoke flows", () => {
  test("admin templates drag-drop reorder and save + users metrics", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto(APP_URL ? `${APP_URL}/admin/templates` : "/admin/templates");
    await expect(page.getByRole("heading", { name: "Exercise Template Studio" })).toBeVisible();

    const firstStudentCheckbox = page.locator('label:has-text("@ahg.com") input[type="checkbox"]').first();
    await firstStudentCheckbox.check();

    const sourceTemplate = page.locator('div[draggable="true"]').first();
    if ((await sourceTemplate.count()) > 0) {
      await expect(sourceTemplate).toBeVisible();

      const dayOneCard = page
        .locator("div.rounded-lg.border.bg-background.p-3.min-h-44")
        .filter({ has: page.locator("p", { hasText: /^Day 1$/ }) })
        .first();
      await sourceTemplate.dragTo(dayOneCard);
      await expect(dayOneCard.locator('div[draggable="true"]').first()).toBeVisible();

      const saveButton = page.getByRole("button", { name: /Save Day 1-25 Cycle|Saving Cycle/ });
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      await page.waitForTimeout(1200);
    }

    await page.goto(APP_URL ? `${APP_URL}/admin/users` : "/admin/users");
    await expect(page.getByRole("heading", { name: /User Management/i })).toBeVisible();

    const usersResponse = await page.request.get("http://localhost:4000/api/admin/users");
    expect(usersResponse.ok()).toBeTruthy();
    const usersPayload = (await usersResponse.json()) as Array<{
      role?: string;
      studentProfile?: { heightCm?: number; weightKg?: number; fitnessGoal?: string | null };
      heightCm?: number;
      weightKg?: number;
      fitnessGoal?: string | null;
    }>;

    const studentWithMetrics = usersPayload.find((user) => {
      if (String(user.role ?? "").toUpperCase() !== "STUDENT") return false;
      const height = user.studentProfile?.heightCm ?? user.heightCm;
      const weight = user.studentProfile?.weightKg ?? user.weightKg;
      const goal = user.studentProfile?.fitnessGoal ?? user.fitnessGoal;
      return Number(height) > 0 && Number(weight) > 0 && Boolean(goal);
    });

    expect(studentWithMetrics).toBeTruthy();
  });

  test("student current-day task proof submission", async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await page.goto(APP_URL ? `${APP_URL}/student/daily-plan` : "/student/daily-plan");

    const todayResponse = await page.request.get("http://localhost:4000/api/student/plan/today");
    expect(todayResponse.ok()).toBeTruthy();
    const todayPayload = (await todayResponse.json()) as {
      todaysTasks?: Array<{ id: string; submissionStatus?: string }>;
    };

    const targetTask = todayPayload.todaysTasks?.find((task) => task.submissionStatus !== "APPROVED");
    expect(targetTask?.id).toBeTruthy();

    const csrfCookie = (await page.context().cookies()).find((cookie) => cookie.name === "csrfToken")?.value;
    expect(csrfCookie).toBeTruthy();

    const submitResponse = await page.request.post("http://localhost:4000/api/submissions", {
      headers: {
        "x-csrf-token": decodeURIComponent(csrfCookie ?? ""),
      },
      data: { planTaskId: targetTask!.id, studentNote: "playwright smoke" },
    });
    expect([201, 400]).toContain(submitResponse.status());
  });
});
