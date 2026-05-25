# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: event-registration-link-redirect.spec.ts >> Event Registration Link Redirect >> admin creates event with registration link and user can access it
- Location: tests/event-registration-link-redirect.spec.ts:240:3

# Error details

```
ReferenceError: loginAsAdmin is not defined
```

# Test source

```ts
  142 |     // Update the registration link
  143 |     const updateResponse = await page.request.patch(
  144 |       `${BACKEND_URL}/api/events/${createdEvent.id}`,
  145 |       {
  146 |         headers: {
  147 |           Authorization: `Bearer ${token}`,
  148 |         },
  149 |         data: {
  150 |           registrationLink: updatedLink,
  151 |         },
  152 |       }
  153 |     );
  154 | 
  155 |     expect(updateResponse.ok()).toBeTruthy();
  156 |     const updatedEvent = await updateResponse.json() as { registrationLink: string };
  157 |     expect(updatedEvent.registrationLink).toBe(updatedLink);
  158 |     console.log(`✓ Registration link updated from ${initialLink} to ${updatedLink}`);
  159 |   });
  160 | 
  161 |   test("registration link field is properly typed and validated", async ({ page }) => {
  162 |     const token = await getAuthToken(page);
  163 | 
  164 |     // Test with whitespace (should be trimmed)
  165 |     const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
  166 |       headers: {
  167 |         Authorization: `Bearer ${token}`,
  168 |       },
  169 |       data: {
  170 |         title: `EventWhitespace-${Date.now()}`,
  171 |         description: "Test whitespace handling",
  172 |         registrationLink: "  https://example.com/form  ",
  173 |         startTime: new Date(Date.now() + 86400000).toISOString(),
  174 |         endTime: new Date(Date.now() + 90000000).toISOString(),
  175 |       },
  176 |     });
  177 | 
  178 |     expect(createResponse.ok()).toBeTruthy();
  179 |     const event = await createResponse.json() as { registrationLink: string };
  180 |     // Should be trimmed by schema
  181 |     expect(event.registrationLink).toBe("https://example.com/form");
  182 |     console.log("✓ Registration link whitespace properly trimmed");
  183 |   });
  184 | 
  185 |   test("multiple events can have different registration links", async ({ page }) => {
  186 |     const token = await getAuthToken(page);
  187 |     const link1 = "https://form1.example.com";
  188 |     const link2 = "https://form2.example.com";
  189 |     const link3 = "";
  190 | 
  191 |     // Create 3 events with different links
  192 |     const event1Promise = page.request.post(`${BACKEND_URL}/api/events`, {
  193 |       headers: { Authorization: `Bearer ${token}` },
  194 |       data: {
  195 |         title: `Event1-${Date.now()}`,
  196 |         registrationLink: link1,
  197 |         startTime: new Date(Date.now() + 86400000).toISOString(),
  198 |         endTime: new Date(Date.now() + 90000000).toISOString(),
  199 |       },
  200 |     });
  201 | 
  202 |     const event2Promise = page.request.post(`${BACKEND_URL}/api/events`, {
  203 |       headers: { Authorization: `Bearer ${token}` },
  204 |       data: {
  205 |         title: `Event2-${Date.now()}`,
  206 |         registrationLink: link2,
  207 |         startTime: new Date(Date.now() + 86400000).toISOString(),
  208 |         endTime: new Date(Date.now() + 90000000).toISOString(),
  209 |       },
  210 |     });
  211 | 
  212 |     const event3Promise = page.request.post(`${BACKEND_URL}/api/events`, {
  213 |       headers: { Authorization: `Bearer ${token}` },
  214 |       data: {
  215 |         title: `Event3-${Date.now()}`,
  216 |         registrationLink: link3,
  217 |         startTime: new Date(Date.now() + 86400000).toISOString(),
  218 |         endTime: new Date(Date.now() + 90000000).toISOString(),
  219 |       },
  220 |     });
  221 | 
  222 |     const [res1, res2, res3] = await Promise.all([event1Promise, event2Promise, event3Promise]);
  223 |     expect(res1.ok()).toBeTruthy();
  224 |     expect(res2.ok()).toBeTruthy();
  225 |     expect(res3.ok()).toBeTruthy();
  226 | 
  227 |     const ev1 = await res1.json() as { registrationLink: string };
  228 |     const ev2 = await res2.json() as { registrationLink: string };
  229 |     const ev3 = await res3.json() as { registrationLink: string };
  230 | 
  231 |     expect(ev1.registrationLink).toBe(link1);
  232 |     expect(ev2.registrationLink).toBe(link2);
  233 |     expect(ev3.registrationLink).toBe(link3);
  234 |     console.log("✓ Multiple events maintain different registration links");
  235 |   });
  236 | });
  237 | 
  238 | 
  239 | test.describe("Event Registration Link Redirect", () => {
  240 |   test("admin creates event with registration link and user can access it", async ({ page, context }) => {
  241 |     // Step 1: Admin logs in
> 242 |     await loginAsAdmin(page);
      |     ^ ReferenceError: loginAsAdmin is not defined
  243 |     await page.goto(`${APP_URL}/admin/events`);
  244 |     await expect(page.getByRole("heading")).toContainText(/event|manage/i);
  245 | 
  246 |     // Step 2: Admin opens event creation form
  247 |     const createEventButton = page.getByRole("button", { name: /create|new|add/i }).first();
  248 |     await expect(createEventButton).toBeVisible();
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
```