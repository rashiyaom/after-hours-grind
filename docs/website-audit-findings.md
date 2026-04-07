# Website Audit Findings and Fix Plan

Date: 2026-04-07
Scope: Full frontend logic, auth, RBAC, state/actions, route protection, feature completeness, test coverage

## How to Use This Document
- This file is the source of truth for the fix sequence.
- We will fix items one by one in priority order.
- Each item includes severity, evidence, impact, and remediation target.
- Status values: `not-started`, `in-progress`, `done`.

## Critical Findings

### 1) Authentication bypass: password not validated
- Status: done
- Severity: critical
- Evidence:
  - src/hooks/useStore.tsx:50
  - src/hooks/useStore.tsx:173
  - src/pages/LoginPage.tsx:28
  - src/data/mockData.ts:102
- Problem:
  - Login API only takes email + role and ignores password.
- User impact:
  - Anyone with known test email can authenticate as that role.
- Fix target:
  - Add password support to user model and enforce password validation in login.

### 2) Missing route-level permission checks for sensitive routes
- Status: done
- Severity: critical
- Evidence:
  - src/App.tsx:56
  - src/App.tsx:63
  - src/App.tsx:75
  - src/App.tsx:79
- Problem:
  - Upload and plan-builder pages are reachable without requiredPermission guards.
- User impact:
  - Hidden UI links can be bypassed by direct URL navigation.
- Fix target:
  - Add nested ProtectedRoute wrappers for post_feed and build_plans routes.

### 3) Core actions are no-op in compatibility hook
- Status: done
- Severity: critical
- Evidence:
  - src/hooks/useStore.tsx:618
  - src/hooks/useStore.tsx:619
  - src/hooks/useStore.tsx:620
  - src/hooks/useStore.tsx:621
  - src/hooks/useStore.tsx:646
  - src/hooks/useStore.tsx:647
  - src/hooks/useStore.tsx:648
- Problem:
  - Handlers return undefined and do not mutate state.
- User impact:
  - Success toasts appear but nothing is actually saved.
- Fix target:
  - Implement real state updates for all handlers or route all pages to useAppStore actions directly.

### 4) Signup/login mismatch for runtime-created users
- Status: done
- Severity: critical
- Evidence:
  - src/hooks/useStore.tsx:233
  - src/hooks/useStore.tsx:174
- Problem:
  - Signup writes to current state, but login reads from initialState snapshot.
- User impact:
  - Newly created users may fail to log in after session changes.
- Fix target:
  - Make login lookup use live state via get(), not initialState.

### 5) Notification data contract mismatch
- Status: done
- Severity: critical
- Evidence:
  - src/components/NotificationRow.tsx:26
  - src/components/NotificationRow.tsx:42
  - src/types/index.ts:149
  - src/hooks/useStore.tsx:487
- Problem:
  - UI expects message/icon/type, but notification data and type define different fields.
- User impact:
  - Notification rendering may be blank/wrong.
- Fix target:
  - Align NotificationItem type and payload shape across store + UI.

## High Findings

### 6) Feed video tab mismatch with uploaded media type
- Status: done
- Severity: high
- Evidence:
  - src/pages/student/Feed.tsx:37
  - src/pages/student/UploadPage.tsx:82
- Problem:
  - Videos tab filters `reel`, upload creates `video`.
- User impact:
  - Uploaded videos do not appear in Videos tab.
- Fix target:
  - Filter should include both `video` and `reel`.

### 7) Notifications actions wired but non-functional
- Status: done
- Severity: high
- Evidence:
  - src/pages/student/Notifications.tsx:7
  - src/pages/student/Notifications.tsx:12
  - src/pages/student/Notifications.tsx:14
  - src/hooks/useStore.tsx:647
- Problem:
  - mark-read handlers are no-op.
- User impact:
  - Unread badges never update.
- Fix target:
  - Implement markNotificationRead and markAllNotificationsRead.

### 8) PlanBuilder is UI-only (no persistence)
- Status: done
- Severity: high
- Evidence:
  - src/pages/trainer/PlanBuilder.tsx:14
  - src/pages/trainer/PlanBuilder.tsx:20
- Problem:
  - Publish only shows toast.
- User impact:
  - Trainers think plans are assigned when no data is saved.
- Fix target:
  - Add store action to create/assign plan and call it from handlePublish.

### 9) Two store APIs with inconsistent behavior
- Status: done
- Severity: high
- Evidence:
  - src/hooks/useStore.tsx:167
  - src/hooks/useStore.tsx:541
- Problem:
  - useAppStore and compatibility useStore differ in behavior/contracts.
- User impact:
  - Some pages work, others silently fail.
- Fix target:
  - Normalize on one source and keep compatibility layer fully functional until full migration.

## Medium Findings

### 10) Leaderboard rank logic does not reflect score ordering
- Status: done
- Severity: medium
- Evidence:
  - src/hooks/useStore.tsx:576
  - src/hooks/useStore.tsx:586
- Problem:
  - Rank is assigned before sort and then sorted by rank.
- User impact:
  - Rank display can be misleading.
- Fix target:
  - Sort by score first, then compute rank from sorted index.

### 11) Upload `steps` is collected but unused
- Status: done
- Severity: medium
- Evidence:
  - src/pages/student/UploadPage.tsx:18
  - src/pages/student/UploadPage.tsx:247
- Problem:
  - Steps input not persisted or used.
- User impact:
  - User-entered data is dropped.
- Fix target:
  - Persist to post metadata and/or student progress update.

### 12) Weak type safety configuration
- Status: done
- Severity: medium
- Evidence:
  - tsconfig.app.json:16
  - tsconfig.app.json:25
- Problem:
  - strict and noImplicitAny are disabled.
- User impact:
  - Contract bugs slip through.
- Fix target:
  - Tighten TS config incrementally.

### 13) Unauthorized UX redirects to login
- Status: done
- Severity: medium
- Evidence:
  - src/components/ProtectedRoute.tsx:21
  - src/components/ProtectedRoute.tsx:25
- Problem:
  - Permission denial appears like auth failure.
- User impact:
  - Confusing user flow.
- Fix target:
  - Add unauthorized page and redirect there for denied access.

### 14) Dead auth file remains
- Status: done
- Severity: medium
- Evidence:
  - src/hooks/useAuth.tsx:1
- Problem:
  - Legacy file can mislead contributors.
- User impact:
  - Maintainer confusion.
- Fix target:
  - Delete file or clearly deprecate in docs.

## Testing Gaps
- Status: done
- Severity: high
- Evidence:
  - src/test/example.test.ts:3
- Problem:
  - Only one placeholder test exists.
- Required additions:
  - Auth validation tests
  - Route permission tests
  - Action mutation tests (comment/submission/task/review/notifications/follow)
  - Feed filter tests

## Ordered Fix Sequence
1. Auth hardening (password validation + live-state login lookup)
2. Route-level permission enforcement for upload/plan-builder
3. Implement all no-op handlers in compatibility layer
4. Align notification contracts and notification actions
5. Fix feed video filter mismatch
6. Implement PlanBuilder persistence
7. Fix leaderboard rank computation
8. Persist Upload steps field
9. Unauthorized route UX
10. Remove dead auth file
11. Add focused tests for all above
12. Optional TS strictness tightening (incremental)

## Execution Log
- 2026-04-07: Initial findings documented.
- 2026-04-07: Completed critical finding #1 auth hardening. Added password to user model, enforced password check in login, switched login lookup to live store state, wired signup to persist password, and updated login page to pass password.
- 2026-04-07: Completed critical finding #2 route hardening. Added route-level ProtectedRoute permission guards for student upload (post_feed) and trainer plan-builder (build_plans), preventing direct URL bypass when UI links are hidden.
- 2026-04-07: Completed critical finding #3 compatibility actions. Replaced no-op handlers with real state mutations for followUser, completeTask, addComment, addSubmission, reviewSubmission, markNotificationRead, and markAllNotificationsRead, with UI-refresh wiring for legacy compatibility consumers.
- 2026-04-07: Completed critical finding #4 signup/login consistency. Confirmed login now reads live users from get().users and no longer relies on initialState snapshot.
- 2026-04-07: Completed critical finding #5 notification contract alignment. Updated NotificationItem shape to include message/icon/type and normalized legacy notification payloads to match NotificationRow expectations.
- 2026-04-07: Completed finding #6 feed videos filter. Updated Videos tab logic to include both `video` and `reel` post types so uploaded workout videos appear correctly.
- 2026-04-07: Completed finding #7 notifications actions. Synced mark-read and mark-all-read behavior across legacy notifications and system notifications, and aligned notification IDs so Notifications page actions update global unread indicators as well.
- 2026-04-07: Completed finding #8 PlanBuilder persistence. Added createPlan store action, wired PlanBuilder metadata + student selection state, and persisted plan creation/assignment to store with activity log entries.
- 2026-04-07: Completed finding #9 store consistency. Moved legacy compatibility data (todayTask/submissions/notifications) into `useAppStore.system` and updated compatibility actions to mutate that unified Zustand state, removing module-level mutable legacy state.
- 2026-04-07: Completed finding #10 leaderboard ranking. Updated leaderboard generation to sort by computed score descending, then assign rank from sorted order.
- 2026-04-07: Completed finding #11 upload steps persistence. Upload now parses steps, appends steps to post caption metadata, and updates student `todaySteps` profile value when provided.
- 2026-04-07: Completed finding #12 incremental TS tightening. Enabled `noImplicitAny` and `noFallthroughCasesInSwitch`, then resolved surfaced typing gaps in Achievements badge literals/types.
- 2026-04-07: Completed finding #13 unauthorized UX. Added dedicated unauthorized page/route and updated permission/role-denied redirects to `/unauthorized` so access denials are distinct from auth failures.
- 2026-04-07: Completed finding #14 dead auth cleanup. Removed unused legacy `useAuth` hook file to eliminate misleading duplicate auth entrypoints.
- 2026-04-07: Completed testing-gap closure. Added focused regression tests for password validation, permission gating decisions, key store mutations, and feed tab filtering behavior.
