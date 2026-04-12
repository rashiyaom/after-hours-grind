# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-critical-flows.spec.ts >> critical smoke flows >> admin templates drag-drop reorder and save + users metrics
- Location: tests/smoke-critical-flows.spec.ts:24:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.dragTo: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('div[draggable="true"]').filter({ hasText: /.+/ }).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - link "Logo TheAfterHour Socials" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Logo" [ref=e8]
        - generic [ref=e9]: TheAfterHour Socials
      - link "Review Queue" [ref=e11] [cursor=pointer]:
        - /url: /admin/content
        - img [ref=e12]
        - generic [ref=e13]: Review Queue
      - navigation [ref=e14]:
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /admin/dashboard
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
        - link "Users" [ref=e22] [cursor=pointer]:
          - /url: /admin/users
          - img [ref=e23]
          - generic [ref=e28]: Users
        - link "Templates" [ref=e29] [cursor=pointer]:
          - /url: /admin/templates
          - img [ref=e30]
          - generic [ref=e33]: Templates
        - link "Events" [ref=e35] [cursor=pointer]:
          - /url: /admin/events
          - img [ref=e36]
          - generic [ref=e38]: Events
        - link "Content" [ref=e39] [cursor=pointer]:
          - /url: /admin/content
          - img [ref=e40]
          - generic [ref=e44]: Content
        - link "Permissions" [ref=e45] [cursor=pointer]:
          - /url: /admin/permissions
          - img [ref=e46]
          - generic [ref=e48]: Permissions
      - button "Sign Out" [ref=e50] [cursor=pointer]:
        - img [ref=e51]
        - generic [ref=e54]: Sign Out
    - main [ref=e55]:
      - generic [ref=e58]:
        - generic [ref=e59]:
          - img [ref=e61]
          - generic [ref=e67]:
            - heading "Exercise Template Studio" [level=1] [ref=e68]
            - paragraph [ref=e69]: Create detailed workouts, drag-drop per-day sequences, and bulk save Day 1-25 cycles in one action.
        - generic [ref=e70]:
          - generic [ref=e71]:
            - heading "New Exercise Template" [level=3] [ref=e73]
            - generic [ref=e74]:
              - textbox "Exercise name" [ref=e75]
              - textbox "Execution notes, form cues, progression guidance" [ref=e76]
              - generic [ref=e77]:
                - textbox "Category" [ref=e78]: strength
                - textbox "Difficulty" [ref=e79]: moderate
                - textbox "Sets" [ref=e80]
                - textbox "Reps" [ref=e81]
                - textbox "Rest seconds" [ref=e82]
                - textbox "Duration minutes" [ref=e83]
                - textbox "Equipment" [ref=e84]: basic
                - generic [ref=e85]:
                  - checkbox "Active" [checked] [ref=e86]
                  - text: Active
              - generic [ref=e87]:
                - img [ref=e88]
                - textbox "YouTube video URL" [ref=e91]
              - button "Create Template" [ref=e93] [cursor=pointer]:
                - img
                - text: Create Template
          - generic [ref=e94]:
            - heading "Template Library (0)" [level=3] [ref=e96]
            - paragraph [ref=e99]: No templates created yet.
        - generic [ref=e100]:
          - generic [ref=e101]:
            - heading "Student Scope" [level=3] [ref=e103]
            - generic [ref=e104]:
              - text: Select Students
              - generic [ref=e105]:
                - generic [ref=e106]:
                  - checkbox "Om Rashiya 24cs084@charusat.edu.in" [ref=e107]
                  - generic [ref=e108]: Om Rashiya
                  - generic [ref=e109]: 24cs084@charusat.edu.in
                - generic [ref=e110]:
                  - checkbox "Om Rashiya 2@s.com" [ref=e111]
                  - generic [ref=e112]: Om Rashiya
                  - generic [ref=e113]: 2@s.com
                - generic [ref=e114]:
                  - checkbox "Priya Patel student2@ahg.com" [checked] [active] [ref=e115]
                  - generic [ref=e116]: Priya Patel
                  - generic [ref=e117]: student2@ahg.com
                - generic [ref=e118]:
                  - checkbox "Rahul Sharma student1@ahg.com" [ref=e119]
                  - generic [ref=e120]: Rahul Sharma
                  - generic [ref=e121]: student1@ahg.com
              - button "Save Day 1-25 Cycle" [ref=e122] [cursor=pointer]:
                - img
                - text: Save Day 1-25 Cycle
              - paragraph [ref=e123]: The first selected student is used as the planner baseline when loading existing assignments.
          - heading "Template Bank (Drag Into Day Cells)" [level=3] [ref=e126]
        - generic [ref=e128]:
          - heading "Bulk Week Planner (Day 1-25 Matrix)" [level=3] [ref=e130]
          - generic [ref=e132]:
            - generic [ref=e133]:
              - paragraph [ref=e135]: Day 1
              - generic [ref=e137]: Drop templates here
            - generic [ref=e138]:
              - paragraph [ref=e140]: Day 2
              - generic [ref=e142]: Drop templates here
            - generic [ref=e143]:
              - paragraph [ref=e145]: Day 3
              - generic [ref=e147]: Drop templates here
            - generic [ref=e148]:
              - paragraph [ref=e150]: Day 4
              - generic [ref=e152]: Drop templates here
            - generic [ref=e153]:
              - paragraph [ref=e155]: Day 5
              - generic [ref=e157]: Drop templates here
            - generic [ref=e158]:
              - paragraph [ref=e160]: Day 6
              - generic [ref=e162]: Drop templates here
            - generic [ref=e163]:
              - paragraph [ref=e165]: Day 7
              - generic [ref=e167]: Drop templates here
            - generic [ref=e168]:
              - paragraph [ref=e170]: Day 8
              - generic [ref=e172]: Drop templates here
            - generic [ref=e173]:
              - paragraph [ref=e175]: Day 9
              - generic [ref=e177]: Drop templates here
            - generic [ref=e178]:
              - paragraph [ref=e180]: Day 10
              - generic [ref=e182]: Drop templates here
            - generic [ref=e183]:
              - paragraph [ref=e185]: Day 11
              - generic [ref=e187]: Drop templates here
            - generic [ref=e188]:
              - paragraph [ref=e190]: Day 12
              - generic [ref=e192]: Drop templates here
            - generic [ref=e193]:
              - paragraph [ref=e195]: Day 13
              - generic [ref=e197]: Drop templates here
            - generic [ref=e198]:
              - paragraph [ref=e200]: Day 14
              - generic [ref=e202]: Drop templates here
            - generic [ref=e203]:
              - paragraph [ref=e205]: Day 15
              - generic [ref=e207]: Drop templates here
            - generic [ref=e208]:
              - paragraph [ref=e210]: Day 16
              - generic [ref=e212]: Drop templates here
            - generic [ref=e213]:
              - paragraph [ref=e215]: Day 17
              - generic [ref=e217]: Drop templates here
            - generic [ref=e218]:
              - paragraph [ref=e220]: Day 18
              - generic [ref=e222]: Drop templates here
            - generic [ref=e223]:
              - paragraph [ref=e225]: Day 19
              - generic [ref=e227]: Drop templates here
            - generic [ref=e228]:
              - paragraph [ref=e230]: Day 20
              - generic [ref=e232]: Drop templates here
            - generic [ref=e233]:
              - paragraph [ref=e235]: Day 21
              - generic [ref=e237]: Drop templates here
            - generic [ref=e238]:
              - paragraph [ref=e240]: Day 22
              - generic [ref=e242]: Drop templates here
            - generic [ref=e243]:
              - paragraph [ref=e245]: Day 23
              - generic [ref=e247]: Drop templates here
            - generic [ref=e248]:
              - paragraph [ref=e250]: Day 24
              - generic [ref=e252]: Drop templates here
            - generic [ref=e253]:
              - paragraph [ref=e255]: Day 25
              - generic [ref=e257]: Drop templates here
        - generic [ref=e259]:
          - heading "Recent Assignments" [level=3] [ref=e261]
          - generic [ref=e262]:
            - paragraph [ref=e264]: No assignments yet.
            - paragraph [ref=e265]: Refreshing...
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const APP_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:8082";
  4  | const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "rashiyaom@gmail.com";
  5  | const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "Romashiya@123";
  6  | const STUDENT_EMAIL = process.env.SMOKE_STUDENT_EMAIL ?? "student1@ahg.com";
  7  | const STUDENT_PASSWORD = process.env.SMOKE_STUDENT_PASSWORD ?? "password123";
  8  | 
  9  | async function login(page: Parameters<typeof test>[0]["page"], email: string, password: string) {
  10 |   await page.goto(`${APP_URL}/login`);
  11 |   await page.getByPlaceholder("you@example.com").fill(email);
  12 |   await page.getByPlaceholder("••••••••").fill(password);
  13 |   const loginResponsePromise = page.waitForResponse(
  14 |     (response) =>
  15 |       response.url().includes("/api/auth/login") && response.request().method() === "POST",
  16 |   );
  17 |   await page.getByRole("button", { name: "Sign In" }).click();
  18 |   const loginResponse = await loginResponsePromise;
  19 |   expect(loginResponse.ok()).toBeTruthy();
  20 |   await page.waitForTimeout(1500);
  21 | }
  22 | 
  23 | test.describe.serial("critical smoke flows", () => {
  24 |   test("admin templates drag-drop reorder and save + users metrics", async ({ page }) => {
  25 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  26 | 
  27 |     await page.goto(`${APP_URL}/admin/templates`);
  28 |     await expect(page.getByRole("heading", { name: "Exercise Template Studio" })).toBeVisible();
  29 | 
  30 |     const firstStudentCheckbox = page.locator('label:has-text("@ahg.com") input[type="checkbox"]').first();
  31 |     await firstStudentCheckbox.check();
  32 | 
  33 |     const sourceTemplate = page.locator('div[draggable="true"]').filter({ hasText: /.+/ }).first();
  34 |     const dayOneCell = page.locator('div:has(> p:text-is("Day 1"))').first();
> 35 |     await sourceTemplate.dragTo(dayOneCell);
     |                          ^ Error: locator.dragTo: Test timeout of 30000ms exceeded.
  36 | 
  37 |     await page.getByRole("button", { name: /Save Day 1-25 Cycle|Saving Cycle/ }).click();
  38 |     await expect(page.getByText("Cycle plan saved for selected students. Realtime updates sent.")).toBeVisible();
  39 | 
  40 |     await page.goto(`${APP_URL}/admin/users`);
  41 |     await expect(page.getByText("Height:").first()).toBeVisible();
  42 |     await expect(page.getByText("Weight:").first()).toBeVisible();
  43 |     await expect(page.getByText("Goal:").first()).toBeVisible();
  44 |     await expect(page.getByText("BMI:").first()).toBeVisible();
  45 |   });
  46 | 
  47 |   test("student day 5 checkin task proof upload", async ({ page }) => {
  48 |     await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
  49 | 
  50 |     await page.goto(`${APP_URL}/student/daily-plan`);
  51 | 
  52 |     const day5Button = page.locator("button", { hasText: /^5$/ }).first();
  53 |     await day5Button.click();
  54 | 
  55 |     await expect(page.getByText("Upload weighing scale image")).toBeVisible();
  56 |     await expect(page.getByText("Upload body photo")).toBeVisible();
  57 | 
  58 |     const weighTaskRow = page.locator('div:has-text("Upload weighing scale image")').first();
  59 |     await weighTaskRow.locator("button").first().click();
  60 | 
  61 |     await expect(page.getByText("Submit task proof photo")).toBeVisible();
  62 | 
  63 |     const fileInput = page.locator('input[type="file"]').first();
  64 |     await fileInput.setInputFiles("tests/fixtures/proof.png");
  65 | 
  66 |     await page.getByRole("button", { name: "Submit For Approval" }).click();
  67 |     await expect(page.getByText("Proof uploaded. Waiting for trainer/admin approval before completion.")).toBeVisible();
  68 |   });
  69 | });
  70 | 
```