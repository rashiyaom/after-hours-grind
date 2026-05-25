# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: event-registration-link-redirect.spec.ts >> Event Registration Link Redirect >> event without registration link shows placeholder message
- Location: tests/event-registration-link-redirect.spec.ts:347:3

# Error details

```
ReferenceError: loginAsAdmin is not defined
```

# Test source

```ts
  249 |     await createEventButton.click();
  250 | 
  251 |     // Step 3: Fill in event details
  252 |     const eventNameInput = page.locator("input[placeholder*='Event']").first();
  253 |     await expect(eventNameInput).toBeVisible({ timeout: 5000 });
  254 | 
  255 |     const uniqueEventName = `TestEvent-${Date.now()}`;
  256 |     await eventNameInput.fill(uniqueEventName);
  257 | 
  258 |     // Step 4: Fill in registration link field
  259 |     const registrationLinkInput = page
  260 |       .locator("input[placeholder*='https://docs.google.com/forms']")
  261 |       .first();
  262 | 
  263 |     if (await registrationLinkInput.isVisible()) {
  264 |       await registrationLinkInput.fill(TEST_FORM_URL);
  265 |     } else {
  266 |       // If the placeholder doesn't match exactly, find by label
  267 |       const inputs = page.locator("input[type='text']");
  268 |       const count = await inputs.count();
  269 | 
  270 |       for (let i = 0; i < count; i++) {
  271 |         const placeholder = await inputs.nth(i).getAttribute("placeholder");
  272 |         if (placeholder && placeholder.includes("http")) {
  273 |           await inputs.nth(i).fill(TEST_FORM_URL);
  274 |           break;
  275 |         }
  276 |       }
  277 |     }
  278 | 
  279 |     // Step 5: Submit the form
  280 |     const submitButton = page.getByRole("button", { name: /save|create|submit|confirm/i }).first();
  281 |     await expect(submitButton).toBeVisible();
  282 | 
  283 |     const eventResponsePromise = page.waitForResponse(
  284 |       (response) =>
  285 |         response.url().includes("/api/events") && response.request().method() === "POST",
  286 |     );
  287 |     await submitButton.click();
  288 | 
  289 |     const eventResponse = await eventResponsePromise;
  290 |     expect(eventResponse.ok()).toBeTruthy();
  291 |     await page.waitForTimeout(500);
  292 | 
  293 |     // Step 6: Navigate to public events page as a user
  294 |     // Option 1: Stay logged in and navigate
  295 |     // Option 2: Open in new context (simulating different user)
  296 |     const userPage = await context.newPage();
  297 |     await userPage.goto(`${APP_URL}/events`);
  298 | 
  299 |     // Step 7: Find the created event
  300 |     const eventCard = userPage.locator(`text=${uniqueEventName}`).first();
  301 |     await expect(eventCard).toBeVisible({ timeout: 5000 });
  302 | 
  303 |     // Step 8: Find and verify the Register button
  304 |     const registerButton = eventCard.locator('a, button').filter({ hasText: /register|external/i }).first();
  305 | 
  306 |     if (!registerButton.isVisible()) {
  307 |       // If not found immediately, look for it in parent container
  308 |       const eventContainer = eventCard.locator("..").first();
  309 |       const allButtons = eventContainer.locator('a, button');
  310 |       
  311 |       for (let i = 0; i < await allButtons.count(); i++) {
  312 |         const text = await allButtons.nth(i).textContent();
  313 |         if (text && text.toLowerCase().includes("register")) {
  314 |           await expect(allButtons.nth(i)).toBeVisible();
  315 |           const href = await allButtons.nth(i).getAttribute("href");
  316 |           expect(href).toBe(TEST_FORM_URL);
  317 |           expect(await allButtons.nth(i).getAttribute("target")).toBe("_blank");
  318 |           break;
  319 |         }
  320 |       }
  321 |     } else {
  322 |       // Verify the button links to the registration form
  323 |       const href = await registerButton.getAttribute("href");
  324 |       expect(href).toBe(TEST_FORM_URL);
  325 | 
  326 |       // Verify it opens in new tab
  327 |       expect(await registerButton.getAttribute("target")).toBe("_blank");
  328 | 
  329 |       // Step 9: Verify popup/tab opens with correct URL
  330 |       const [popup] = await Promise.all([
  331 |         context.waitForEvent("page"),
  332 |         registerButton.click(),
  333 |       ]);
  334 | 
  335 |       await popup.waitForLoadState("domcontentloaded").catch(() => {
  336 |         // URL interception might prevent full load in test
  337 |       });
  338 | 
  339 |       expect(popup.url()).toContain(new URL(TEST_FORM_URL).hostname);
  340 |       await popup.close();
  341 |     }
  342 | 
  343 |     await userPage.close();
  344 |     console.log("✓ Event registration link redirect flow verified successfully");
  345 |   });
  346 | 
  347 |   test("event without registration link shows placeholder message", async ({ page }) => {
  348 |     // Step 1: Admin logs in
> 349 |     await loginAsAdmin(page);
      |     ^ ReferenceError: loginAsAdmin is not defined
  350 |     await page.goto(`${APP_URL}/admin/events`);
  351 | 
  352 |     // Step 2: Create event WITHOUT registration link
  353 |     const createEventButton = page.getByRole("button", { name: /create|new|add/i }).first();
  354 |     await createEventButton.click();
  355 | 
  356 |     const eventNameInput = page.locator("input[placeholder*='Event']").first();
  357 |     await expect(eventNameInput).toBeVisible({ timeout: 5000 });
  358 | 
  359 |     const uniqueEventName = `EventNoLink-${Date.now()}`;
  360 |     await eventNameInput.fill(uniqueEventName);
  361 | 
  362 |     // Leave registration link empty and submit
  363 |     const submitButton = page.getByRole("button", { name: /save|create|submit|confirm/i }).first();
  364 |     const eventResponsePromise = page.waitForResponse(
  365 |       (response) =>
  366 |         response.url().includes("/api/events") && response.request().method() === "POST",
  367 |     );
  368 |     await submitButton.click();
  369 | 
  370 |     const eventResponse = await eventResponsePromise;
  371 |     expect(eventResponse.ok()).toBeTruthy();
  372 |     await page.waitForTimeout(500);
  373 | 
  374 |     // Step 3: Navigate to public events page
  375 |     await page.goto(`${APP_URL}/events`);
  376 | 
  377 |     // Step 4: Verify placeholder message appears when no registration link
  378 |     const eventCard = page.locator(`text=${uniqueEventName}`).first();
  379 |     await expect(eventCard).toBeVisible({ timeout: 5000 });
  380 | 
  381 |     const placeholderText = eventCard
  382 |       .locator("..")
  383 |       .locator("text=/Registration Link Coming Soon|Register/i")
  384 |       .first();
  385 |     await expect(placeholderText).toBeVisible();
  386 | 
  387 |     console.log("✓ Placeholder message shown correctly for event without registration link");
  388 |   });
  389 | });
  390 | 
```