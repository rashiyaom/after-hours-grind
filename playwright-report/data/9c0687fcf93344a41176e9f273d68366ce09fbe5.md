# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: event-registration-link-redirect.spec.ts >> Event Registration Link Feature - Regression Tests >> registration link field is properly typed and validated
- Location: tests/event-registration-link-redirect.spec.ts:161:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  78  |     expect(createResponse.ok()).toBeTruthy();
  79  |     const createdEvent = await createResponse.json() as { id: string };
  80  | 
  81  |     // Retrieve all events and verify the link persists
  82  |     const listResponse = await page.request.get(`${BACKEND_URL}/api/events`, {
  83  |       headers: {
  84  |         Authorization: `Bearer ${token}`,
  85  |       },
  86  |     });
  87  | 
  88  |     expect(listResponse.ok()).toBeTruthy();
  89  |     const events = await listResponse.json() as Array<{ id: string; title: string; registrationLink: string }>;
  90  |     const foundEvent = events.find((e) => e.id === createdEvent.id);
  91  |     expect(foundEvent).toBeTruthy();
  92  |     expect(foundEvent!.registrationLink).toBe(testFormUrl);
  93  |     console.log(`✓ Registration link persisted: ${foundEvent!.registrationLink}`);
  94  |   });
  95  | 
  96  |   test("event without registration link defaults to empty string", async ({ page }) => {
  97  |     const token = await getAuthToken(page);
  98  |     const eventTitle = `EventNoLink-${Date.now()}`;
  99  | 
  100 |     const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
  101 |       headers: {
  102 |         Authorization: `Bearer ${token}`,
  103 |       },
  104 |       data: {
  105 |         title: eventTitle,
  106 |         description: "Event without registration link",
  107 |         // registrationLink not provided - should default to ""
  108 |         startTime: new Date(Date.now() + 86400000).toISOString(),
  109 |         endTime: new Date(Date.now() + 90000000).toISOString(),
  110 |       },
  111 |     });
  112 | 
  113 |     expect(createResponse.ok()).toBeTruthy();
  114 |     const event = await createResponse.json() as { registrationLink: string };
  115 |     expect(event.registrationLink).toBe("");
  116 |     console.log("✓ Event without link defaults to empty string");
  117 |   });
  118 | 
  119 |   test("admin can update event registration link", async ({ page }) => {
  120 |     const token = await getAuthToken(page);
  121 |     const initialLink = "https://form.example.com/initial";
  122 |     const updatedLink = "https://form.example.com/updated";
  123 |     const eventTitle = `EventUpdate-${Date.now()}`;
  124 | 
  125 |     // Create with initial link
  126 |     const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
  127 |       headers: {
  128 |         Authorization: `Bearer ${token}`,
  129 |       },
  130 |       data: {
  131 |         title: eventTitle,
  132 |         description: "Event for update test",
  133 |         registrationLink: initialLink,
  134 |         startTime: new Date(Date.now() + 86400000).toISOString(),
  135 |         endTime: new Date(Date.now() + 90000000).toISOString(),
  136 |       },
  137 |     });
  138 | 
  139 |     expect(createResponse.ok()).toBeTruthy();
  140 |     const createdEvent = await createResponse.json() as { id: string };
  141 | 
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
> 178 |     expect(createResponse.ok()).toBeTruthy();
      |                                 ^ Error: expect(received).toBeTruthy()
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
  242 |     await loginAsAdmin(page);
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
```