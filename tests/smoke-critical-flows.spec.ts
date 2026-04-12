import { test, expect } from "@playwright/test";

const APP_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:8082";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "rashiyaom@gmail.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "Romashiya@123";
const STUDENT_EMAIL = process.env.SMOKE_STUDENT_EMAIL ?? "student1@ahg.com";
const STUDENT_PASSWORD = process.env.SMOKE_STUDENT_PASSWORD ?? "password123";

async function login(page: Parameters<typeof test>[0]["page"], email: string, password: string) {
  await page.goto(`${APP_URL}/login`);
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

    await page.goto(`${APP_URL}/admin/templates`);
    await expect(page.getByRole("heading", { name: "Exercise Template Studio" })).toBeVisible();

    const firstStudentCheckbox = page.locator('label:has-text("@ahg.com") input[type="checkbox"]').first();
    await firstStudentCheckbox.check();

    const sourceTemplate = page.locator('div[draggable="true"]').filter({ hasText: /.+/ }).first();
    const dayOneCell = page.locator('div:has(> p:text-is("Day 1"))').first();
    await sourceTemplate.dragTo(dayOneCell);

    await page.getByRole("button", { name: /Save Day 1-25 Cycle|Saving Cycle/ }).click();
    await expect(page.getByText("Cycle plan saved for selected students. Realtime updates sent.")).toBeVisible();

    await page.goto(`${APP_URL}/admin/users`);
    await expect(page.getByText("Height:").first()).toBeVisible();
    await expect(page.getByText("Weight:").first()).toBeVisible();
    await expect(page.getByText("Goal:").first()).toBeVisible();
    await expect(page.getByText("BMI:").first()).toBeVisible();
  });

  test("student day 5 checkin task proof upload", async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await page.goto(`${APP_URL}/student/daily-plan`);

    const day5Button = page.locator("button", { hasText: /^5$/ }).first();
    await day5Button.click();

    await expect(page.getByText("Upload weighing scale image")).toBeVisible();
    await expect(page.getByText("Upload body photo")).toBeVisible();

    const weighTaskRow = page.locator('div:has-text("Upload weighing scale image")').first();
    await weighTaskRow.locator("button").first().click();

    await expect(page.getByText("Submit task proof photo")).toBeVisible();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles("tests/fixtures/proof.png");

    await page.getByRole("button", { name: "Submit For Approval" }).click();
    await expect(page.getByText("Proof uploaded. Waiting for trainer/admin approval before completion.")).toBeVisible();
  });
});
