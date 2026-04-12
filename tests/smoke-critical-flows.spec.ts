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

async function createTemplateForSmoke(page: Parameters<typeof test>[0]["page"]) {
  const templateName = `Smoke Template ${Date.now()}`;
  const createTemplateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/exercise-templates") && response.request().method() === "POST",
  );
  await page.getByPlaceholder("Exercise name").fill(templateName);
  await page.getByRole("button", { name: "Create Template" }).click();
  const createTemplateResponse = await createTemplateResponsePromise;
  expect(createTemplateResponse.ok()).toBeTruthy();
  await expect(page.getByText(templateName).first()).toBeVisible();
  return templateName;
}

test.describe.serial("critical smoke flows", () => {
  test("admin templates drag-drop reorder and save + users metrics", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto(APP_URL ? `${APP_URL}/admin/templates` : "/admin/templates");
    await expect(page.getByRole("heading", { name: "Exercise Template Studio" })).toBeVisible();

    const firstStudentCheckbox = page.locator('label:has-text("@ahg.com") input[type="checkbox"]').first();
    await firstStudentCheckbox.check();

    let sourceTemplate = page.locator('div[draggable="true"]').first();
    if ((await sourceTemplate.count()) === 0) {
      await createTemplateForSmoke(page);
      sourceTemplate = page.locator('div[draggable="true"]').first();
    }
    await expect(sourceTemplate).toBeVisible();

    const dayOneCard = page
      .locator("div.rounded-lg.border.bg-background.p-3.min-h-44")
      .filter({ has: page.locator("p", { hasText: /^Day 1$/ }) })
      .first();
    await sourceTemplate.dragTo(dayOneCard);
    await expect(dayOneCard.locator('div[draggable="true"]').first()).toBeVisible();

    const saveCycleResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/exercise-templates/assign-bulk") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Save Day 1-25 Cycle|Saving Cycle/ }).click();
    const saveCycleResponse = await saveCycleResponsePromise;
    expect(saveCycleResponse.ok()).toBeTruthy();

    await page.goto(APP_URL ? `${APP_URL}/admin/users` : "/admin/users");
    await expect(page.getByText("Height:").first()).toBeVisible();
    await expect(page.getByText("Weight:").first()).toBeVisible();
    await expect(page.getByText("Goal:").first()).toBeVisible();
    await expect(page.getByText("BMI:").first()).toBeVisible();
  });

  test("student day 5 checkin task proof upload", async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await page.goto(APP_URL ? `${APP_URL}/student/daily-plan` : "/student/daily-plan");

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
