import { test, expect } from "@playwright/test";

/**
 * Event Registration Link Feature - Regression Test
 * 
 * This test verifies the event registration link feature:
 * - Admin can create events with external registration URLs
 * - The registrationLink field persists in the database
 * - Events without registration links have empty string default
 * - Registration links can be updated
 * 
 * This is primarily an API-based test for reliability and CI/CD integration.
 * The feature enables admins to redirect users to external forms (e.g., Google Forms)
 * for event registration instead of using custom in-app form fields.
 */

const BACKEND_URL = "http://localhost:4000";
const ADMIN_EMAIL = "rashiyaom@gmail.com";
const ADMIN_PASSWORD = "Romashiya@123";

async function getAuthToken(page: Parameters<typeof test>[0]["page"]): Promise<string> {
  const loginResponse = await page.request.post(`${BACKEND_URL}/api/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });
  
  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json() as { accessToken: string };
  return loginData.accessToken;
}

test.describe("Event Registration Link Feature - Regression Tests", () => {
  test("admin can create event with registration link URL", async ({ page }) => {
    const token = await getAuthToken(page);
    const testFormUrl = "https://docs.google.com/forms/d/e/test-form-id/viewform";
    const eventTitle = `EventWithLink-${Date.now()}`;

    const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: eventTitle,
        description: "Test event with registration link",
        registrationLink: testFormUrl,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const event = await createResponse.json() as { id: string; registrationLink: string };
    expect(event.registrationLink).toBe(testFormUrl);
    console.log(`✓ Event created with registration link: ${event.id}`);
  });

  test("registration link persists when retrieving events", async ({ page }) => {
    const token = await getAuthToken(page);
    const testFormUrl = "https://example.com/registration-form";
    const eventTitle = `EventLink-${Date.now()}`;

    // Create event with registration link
    const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: eventTitle,
        description: "Event for persistence test",
        registrationLink: testFormUrl,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createdEvent = await createResponse.json() as { id: string };

    // Retrieve all events and verify the link persists
    const listResponse = await page.request.get(`${BACKEND_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const events = await listResponse.json() as Array<{ id: string; title: string; registrationLink: string }>;
    const foundEvent = events.find((e) => e.id === createdEvent.id);
    expect(foundEvent).toBeTruthy();
    expect(foundEvent!.registrationLink).toBe(testFormUrl);
    console.log(`✓ Registration link persisted: ${foundEvent!.registrationLink}`);
  });

  test("event without registration link defaults to empty string", async ({ page }) => {
    const token = await getAuthToken(page);
    const eventTitle = `EventNoLink-${Date.now()}`;

    const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: eventTitle,
        description: "Event without registration link",
        // registrationLink not provided - should default to ""
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const event = await createResponse.json() as { registrationLink: string };
    expect(event.registrationLink).toBe("");
    console.log("✓ Event without link defaults to empty string");
  });

  test("admin can update event registration link", async ({ page }) => {
    const token = await getAuthToken(page);
    const initialLink = "https://form.example.com/initial";
    const updatedLink = "https://form.example.com/updated";
    const eventTitle = `EventUpdate-${Date.now()}`;

    // Create with initial link
    const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: eventTitle,
        description: "Event for update test",
        registrationLink: initialLink,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createdEvent = await createResponse.json() as { id: string };

    // Update the registration link
    const updateResponse = await page.request.patch(
      `${BACKEND_URL}/api/events/${createdEvent.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          registrationLink: updatedLink,
        },
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const updatedEvent = await updateResponse.json() as { registrationLink: string };
    expect(updatedEvent.registrationLink).toBe(updatedLink);
    console.log(`✓ Registration link updated from ${initialLink} to ${updatedLink}`);
  });

  test("registration link field is properly typed and validated", async ({ page }) => {
    const token = await getAuthToken(page);

    // Test with whitespace (should be trimmed)
    const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: `EventWhitespace-${Date.now()}`,
        description: "Test whitespace handling",
        registrationLink: "  https://example.com/form  ",
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const event = await createResponse.json() as { registrationLink: string };
    // Should be trimmed by schema
    expect(event.registrationLink).toBe("https://example.com/form");
    console.log("✓ Registration link whitespace properly trimmed");
  });

  test("multiple events can have different registration links", async ({ page }) => {
    const token = await getAuthToken(page);
    const link1 = "https://form1.example.com";
    const link2 = "https://form2.example.com";
    const link3 = "";

    // Create 3 events with different links
    const event1Promise = page.request.post(`${BACKEND_URL}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: `Event1-${Date.now()}`,
        registrationLink: link1,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    const event2Promise = page.request.post(`${BACKEND_URL}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: `Event2-${Date.now()}`,
        registrationLink: link2,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    const event3Promise = page.request.post(`${BACKEND_URL}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: `Event3-${Date.now()}`,
        registrationLink: link3,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
      },
    });

    const [res1, res2, res3] = await Promise.all([event1Promise, event2Promise, event3Promise]);
    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();
    expect(res3.ok()).toBeTruthy();

    const ev1 = await res1.json() as { registrationLink: string };
    const ev2 = await res2.json() as { registrationLink: string };
    const ev3 = await res3.json() as { registrationLink: string };

    expect(ev1.registrationLink).toBe(link1);
    expect(ev2.registrationLink).toBe(link2);
    expect(ev3.registrationLink).toBe(link3);
    console.log("✓ Multiple events maintain different registration links");
  });
});


test.describe("Event Registration Link Redirect", () => {
  test("admin creates event with registration link and user can access it", async ({ page, context }) => {
    // Step 1: Admin logs in
    await loginAsAdmin(page);
    await page.goto(`${APP_URL}/admin/events`);
    await expect(page.getByRole("heading")).toContainText(/event|manage/i);

    // Step 2: Admin opens event creation form
    const createEventButton = page.getByRole("button", { name: /create|new|add/i }).first();
    await expect(createEventButton).toBeVisible();
    await createEventButton.click();

    // Step 3: Fill in event details
    const eventNameInput = page.locator("input[placeholder*='Event']").first();
    await expect(eventNameInput).toBeVisible({ timeout: 5000 });

    const uniqueEventName = `TestEvent-${Date.now()}`;
    await eventNameInput.fill(uniqueEventName);

    // Step 4: Fill in registration link field
    const registrationLinkInput = page
      .locator("input[placeholder*='https://docs.google.com/forms']")
      .first();

    if (await registrationLinkInput.isVisible()) {
      await registrationLinkInput.fill(TEST_FORM_URL);
    } else {
      // If the placeholder doesn't match exactly, find by label
      const inputs = page.locator("input[type='text']");
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const placeholder = await inputs.nth(i).getAttribute("placeholder");
        if (placeholder && placeholder.includes("http")) {
          await inputs.nth(i).fill(TEST_FORM_URL);
          break;
        }
      }
    }

    // Step 5: Submit the form
    const submitButton = page.getByRole("button", { name: /save|create|submit|confirm/i }).first();
    await expect(submitButton).toBeVisible();

    const eventResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/events") && response.request().method() === "POST",
    );
    await submitButton.click();

    const eventResponse = await eventResponsePromise;
    expect(eventResponse.ok()).toBeTruthy();
    await page.waitForTimeout(500);

    // Step 6: Navigate to public events page as a user
    // Option 1: Stay logged in and navigate
    // Option 2: Open in new context (simulating different user)
    const userPage = await context.newPage();
    await userPage.goto(`${APP_URL}/events`);

    // Step 7: Find the created event
    const eventCard = userPage.locator(`text=${uniqueEventName}`).first();
    await expect(eventCard).toBeVisible({ timeout: 5000 });

    // Step 8: Find and verify the Register button
    const registerButton = eventCard.locator('a, button').filter({ hasText: /register|external/i }).first();

    if (!registerButton.isVisible()) {
      // If not found immediately, look for it in parent container
      const eventContainer = eventCard.locator("..").first();
      const allButtons = eventContainer.locator('a, button');
      
      for (let i = 0; i < await allButtons.count(); i++) {
        const text = await allButtons.nth(i).textContent();
        if (text && text.toLowerCase().includes("register")) {
          await expect(allButtons.nth(i)).toBeVisible();
          const href = await allButtons.nth(i).getAttribute("href");
          expect(href).toBe(TEST_FORM_URL);
          expect(await allButtons.nth(i).getAttribute("target")).toBe("_blank");
          break;
        }
      }
    } else {
      // Verify the button links to the registration form
      const href = await registerButton.getAttribute("href");
      expect(href).toBe(TEST_FORM_URL);

      // Verify it opens in new tab
      expect(await registerButton.getAttribute("target")).toBe("_blank");

      // Step 9: Verify popup/tab opens with correct URL
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        registerButton.click(),
      ]);

      await popup.waitForLoadState("domcontentloaded").catch(() => {
        // URL interception might prevent full load in test
      });

      expect(popup.url()).toContain(new URL(TEST_FORM_URL).hostname);
      await popup.close();
    }

    await userPage.close();
    console.log("✓ Event registration link redirect flow verified successfully");
  });

  test("event without registration link shows placeholder message", async ({ page }) => {
    // Step 1: Admin logs in
    await loginAsAdmin(page);
    await page.goto(`${APP_URL}/admin/events`);

    // Step 2: Create event WITHOUT registration link
    const createEventButton = page.getByRole("button", { name: /create|new|add/i }).first();
    await createEventButton.click();

    const eventNameInput = page.locator("input[placeholder*='Event']").first();
    await expect(eventNameInput).toBeVisible({ timeout: 5000 });

    const uniqueEventName = `EventNoLink-${Date.now()}`;
    await eventNameInput.fill(uniqueEventName);

    // Leave registration link empty and submit
    const submitButton = page.getByRole("button", { name: /save|create|submit|confirm/i }).first();
    const eventResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/events") && response.request().method() === "POST",
    );
    await submitButton.click();

    const eventResponse = await eventResponsePromise;
    expect(eventResponse.ok()).toBeTruthy();
    await page.waitForTimeout(500);

    // Step 3: Navigate to public events page
    await page.goto(`${APP_URL}/events`);

    // Step 4: Verify placeholder message appears when no registration link
    const eventCard = page.locator(`text=${uniqueEventName}`).first();
    await expect(eventCard).toBeVisible({ timeout: 5000 });

    const placeholderText = eventCard
      .locator("..")
      .locator("text=/Registration Link Coming Soon|Register/i")
      .first();
    await expect(placeholderText).toBeVisible();

    console.log("✓ Placeholder message shown correctly for event without registration link");
  });
});
