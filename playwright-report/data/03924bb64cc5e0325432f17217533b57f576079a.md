# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: event-registration-link-redirect.spec.ts >> Event Registration Link Feature - Regression Tests >> admin can update event registration link
- Location: tests/event-registration-link-redirect.spec.ts:119:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Event Registration Link Feature - Regression Test
  5   |  * 
  6   |  * This test verifies the event registration link feature:
  7   |  * - Admin can create events with external registration URLs
  8   |  * - The registrationLink field persists in the database
  9   |  * - Events without registration links have empty string default
  10  |  * - Registration links can be updated
  11  |  * 
  12  |  * This is primarily an API-based test for reliability and CI/CD integration.
  13  |  * The feature enables admins to redirect users to external forms (e.g., Google Forms)
  14  |  * for event registration instead of using custom in-app form fields.
  15  |  */
  16  | 
  17  | const BACKEND_URL = "http://localhost:4000";
  18  | const ADMIN_EMAIL = "rashiyaom@gmail.com";
  19  | const ADMIN_PASSWORD = "Romashiya@123";
  20  | 
  21  | async function getAuthToken(page: Parameters<typeof test>[0]["page"]): Promise<string> {
  22  |   const loginResponse = await page.request.post(`${BACKEND_URL}/api/auth/login`, {
  23  |     data: {
  24  |       email: ADMIN_EMAIL,
  25  |       password: ADMIN_PASSWORD,
  26  |     },
  27  |   });
  28  |   
> 29  |   expect(loginResponse.ok()).toBeTruthy();
      |                              ^ Error: expect(received).toBeTruthy()
  30  |   const loginData = await loginResponse.json() as { accessToken: string };
  31  |   return loginData.accessToken;
  32  | }
  33  | 
  34  | test.describe("Event Registration Link Feature - Regression Tests", () => {
  35  |   test("admin can create event with registration link URL", async ({ page }) => {
  36  |     const token = await getAuthToken(page);
  37  |     const testFormUrl = "https://docs.google.com/forms/d/e/test-form-id/viewform";
  38  |     const eventTitle = `EventWithLink-${Date.now()}`;
  39  | 
  40  |     const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
  41  |       headers: {
  42  |         Authorization: `Bearer ${token}`,
  43  |       },
  44  |       data: {
  45  |         title: eventTitle,
  46  |         description: "Test event with registration link",
  47  |         registrationLink: testFormUrl,
  48  |         startTime: new Date(Date.now() + 86400000).toISOString(),
  49  |         endTime: new Date(Date.now() + 90000000).toISOString(),
  50  |       },
  51  |     });
  52  | 
  53  |     expect(createResponse.ok()).toBeTruthy();
  54  |     const event = await createResponse.json() as { id: string; registrationLink: string };
  55  |     expect(event.registrationLink).toBe(testFormUrl);
  56  |     console.log(`✓ Event created with registration link: ${event.id}`);
  57  |   });
  58  | 
  59  |   test("registration link persists when retrieving events", async ({ page }) => {
  60  |     const token = await getAuthToken(page);
  61  |     const testFormUrl = "https://example.com/registration-form";
  62  |     const eventTitle = `EventLink-${Date.now()}`;
  63  | 
  64  |     // Create event with registration link
  65  |     const createResponse = await page.request.post(`${BACKEND_URL}/api/events`, {
  66  |       headers: {
  67  |         Authorization: `Bearer ${token}`,
  68  |       },
  69  |       data: {
  70  |         title: eventTitle,
  71  |         description: "Event for persistence test",
  72  |         registrationLink: testFormUrl,
  73  |         startTime: new Date(Date.now() + 86400000).toISOString(),
  74  |         endTime: new Date(Date.now() + 90000000).toISOString(),
  75  |       },
  76  |     });
  77  | 
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
```