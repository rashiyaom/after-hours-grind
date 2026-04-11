# Extreme Deep System Audit

Date: 2026-04-10
Workspace: after-hours-grind
Auditor: GitHub Copilot (GPT-5.3-Codex)

## 1) Scope And Method

This audit covered frontend + backend + DB wiring with a production-readiness and scale-readiness lens.

What was inspected:
- Full repository structure (frontend and backend)
- Backend module architecture (routes/controllers/services/middleware/config)
- Prisma schema + migration + seed
- Auth/session/token lifecycle
- Role/permission/ownership enforcement
- API contract alignment frontend-to-backend
- Data exposure and privacy risks
- Performance behavior for high user count
- Test and build quality signals

What was executed during this scan:
- Frontend: lint/test/build
- Backend: build/test
- Prisma migration status
- Live DB probe via Prisma client (`SELECT 1`)

## 2) Executive Summary

Current state in one line:
- After remediation, the app is runnable and significantly hardened, but **not production-safe at heavy scale yet** due to remaining scalability and operational maturity gaps.

Top blockers identified in the initial scan (now remediated except long-term scale work):
1. Sensitive data overexposure in multiple backend responses (password hash leakage risk)
2. PostgreSQL migration drift in target environment
3. Chat backend contract gap vs frontend (message type handling, missing thread-creation path)
4. Token/cookie lifecycle inconsistencies (frontend logout does not revoke backend refresh token)
5. Scaling bottlenecks (no cache strategy, no global rate limits, full-feed hydrations)

### Remediation Update (Applied)

Implemented in codebase after this audit:

- C1 fixed: backend responses were sanitized to avoid password hash and private draft leakage across admin/athlete/trainer-student endpoints.
- C2 fixed: chat API now accepts typed payloads (`text`, `reel-share`, `voice-note`) with metadata fields.
- C3 fixed: backend now exposes `POST /threads` and frontend store calls backend thread creation before first message.
- C4 fixed: migration drift resolved by baselining init migration and applying new chat payload migration.
- H1 fixed: frontend logout now calls backend logout endpoint and clears local access/session state.
- H2 fixed: cookie and DB refresh expiry now derive from env TTL parsing instead of hardcoded values.
- H3 fixed: admin moderation status now validated against strict enum.
- H4 fixed: privileged student profile fields were removed from self-update API contract.
- H5 fixed: global and write-path rate limits were added across API/feed/chat routes.
- M3 improved: notifications endpoint now supports cursor+limit pagination.
- M5 improved: root README now reflects current full-stack/backend-integrated architecture.
- M1 improved: feed now hydrates incrementally from cursor-based backend pages instead of replacing full in-memory feed in one shot.
- Live-data startup improved: app now bootstraps session from backend auth state on load (instead of seeded local users) before rendering protected routes.
- Seed/offline auth fallback removed: login/signup now require backend success and no longer authenticate against local demo data.
- Notification read flow improved: client now calls backend `POST /notifications/:id/read` for single and bulk read actions.
- Near-real-time updates improved: authenticated app shell now refreshes live backend data on an interval.

Remaining longer-term items:

- M2 (distributed read caching) and M4 (DB-backed non-mocked integration suite expansion) remain roadmap-level work.
- Feed virtualization/windowing for very large client-side render sets is still recommended as a follow-up hardening step.

## 3) Backend Completeness Check (File Presence)

Backend module presence is structurally strong.

Confirmed present:
- Auth: routes/controller/service/schema
- Users: routes/controller/service/schema
- Feed: routes/controller/service/schema
- Plans + submissions: routes/controller/service
- Chat: routes/controller/service
- Notifications: routes/controller/service
- Events: routes/controller/service
- Admin: routes/controller/service
- Middleware: auth, role, permission, rate-limit, errors, request-context, optional-auth
- Config: env, prisma, redis
- Prisma: schema + migration + seed
- Tests: integration suite exists

Conclusion:
- **Backend files are present and organized well**.
- Main issues are not missing folders/files, but implementation and production-hardening details.

## 4) PostgreSQL + Prisma Status

### 4.1 Wiring Status

Verified:
- Prisma datasource uses PostgreSQL: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L5)
- Environment schema enforces `DATABASE_URL`: [backend/src/config/env.ts](backend/src/config/env.ts#L9)
- Prisma singleton is configured: [backend/src/config/prisma.ts](backend/src/config/prisma.ts#L1)
- Health route checks DB using `SELECT 1`: [backend/src/routes/health.ts](backend/src/routes/health.ts#L7)

### 4.2 Runtime Connectivity

Verified from terminal:
- DB connectivity probe returned `DB_OK` via Prisma query.

Interpretation:
- PostgreSQL is reachable from backend runtime.

### 4.3 Migration Health

Verified from terminal:
- `npx prisma migrate status` now reports database schema is up to date.
- Applied history includes:
  - `20260410100000_init` (baselined in existing DB)
  - `20260410184500_chat_message_payload` (applied)

Current risk posture:
- Migration drift observed in the initial scan was remediated in this pass.
- Ongoing requirement remains to enforce migration checks in CI/CD.

Required fix:
- Keep applying migrations in deploy path (`prisma migrate deploy`) and enforce migration check in CI/CD.

### 4.4 Secret Hygiene Warning

Observed in local backend env file:
- A real-looking database connection string and default-style JWT secrets are present in [backend/.env](backend/.env#L5).

Notes:
- `.env` is ignored by [backend/.gitignore](backend/.gitignore#L3), which is good.
- Still, rotate exposed values immediately if they were ever shared/synced.

## 5) Critical Findings

## C1) Sensitive user data is exposed by backend responses

Evidence:
- Featured athletes endpoint includes entire `user` object: [backend/src/modules/users/users.service.ts](backend/src/modules/users/users.service.ts#L88)
- Admin users list returns `prisma.user.findMany` with no field sanitization: [backend/src/modules/admin/admin.service.ts](backend/src/modules/admin/admin.service.ts#L5)
- Admin activity logs include recent users via full `findMany`: [backend/src/modules/admin/admin.service.ts](backend/src/modules/admin/admin.service.ts#L38)

Why critical:
- Full user payload can include `passwordHash`, email, and other sensitive fields.
- This is a direct confidentiality breach risk.

Required remediation:
- Introduce strict response DTO/select-lists everywhere.
- Never return `passwordHash` from any endpoint.
- Add contract tests asserting forbidden fields are absent.

## C2) Chat API contract mismatch for advanced message types

Evidence:
- Frontend sends `type` field in chat API: [src/lib/api.ts](src/lib/api.ts#L206)
- Backend chat controller only accepts `text`: [backend/src/modules/chat/chat.controller.ts](backend/src/modules/chat/chat.controller.ts#L5)
- Backend chat service only stores text payload: [backend/src/modules/chat/chat.service.ts](backend/src/modules/chat/chat.service.ts#L33)

Why critical:
- Voice-note/reel-share semantics are dropped server-side.
- Data mismatch causes broken or inconsistent UX across refresh/devices.

Required remediation:
- Extend backend chat schema/controller/service to support `type`, optional media metadata, and validation.
- Add migration for typed chat payload fields if needed.

## C3) Frontend can generate direct thread IDs without backend thread creation API

Evidence:
- Frontend computes deterministic thread IDs and attempts send: [src/hooks/useStore.tsx](src/hooks/useStore.tsx#L1772)
- Backend has message-send routes but no “create thread” endpoint: [backend/src/modules/chat/chat.routes.ts](backend/src/modules/chat/chat.routes.ts#L10)

Why critical:
- New conversations may fail unless thread/participants already exist.
- Breaks trainer-student and student-student initiation reliability.

Required remediation:
- Add `POST /threads` creation endpoint with participant checks.
- Frontend should call create-thread before first message.

## C4) Migration drift exists in connected Postgres

Evidence:
- Prisma migration status shows pending init migration.

Why critical:
- Environment inconsistency causes runtime differences and deployment failures.

Required remediation:
- Apply pending migrations to target DB.
- Gate deployment on `prisma migrate status` clean state.

## 6) High Findings

## H1) Logout lifecycle inconsistency (frontend does not revoke backend refresh token)

Evidence:
- Frontend app logout path calls local store logout: [src/layouts/AppLayout.tsx](src/layouts/AppLayout.tsx#L115)
- Store logout clears local state only: [src/hooks/useStore.tsx](src/hooks/useStore.tsx#L1183)
- Backend has logout endpoint with token revocation: [backend/src/modules/auth/auth.controller.ts](backend/src/modules/auth/auth.controller.ts#L54)

Impact:
- Refresh cookie/token may remain valid server-side if backend logout is not called.

Fix:
- On logout, call backend `/auth/logout`, then clear local session/access token.

## H2) Token and cookie expiry policy is hardcoded and can drift from env

Evidence:
- Env has configurable `REFRESH_TOKEN_TTL`: [backend/src/config/env.ts](backend/src/config/env.ts#L13)
- JWT uses env TTL: [backend/src/lib/jwt.ts](backend/src/lib/jwt.ts#L10)
- DB refresh expiry and cookie maxAge are hardcoded to 7 days:
  - [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts#L8)
  - [backend/src/modules/auth/auth.controller.ts](backend/src/modules/auth/auth.controller.ts#L18)

Impact:
- Divergent expiry behavior across JWT, DB token rows, and cookies.

Fix:
- Derive all expiry windows from one parsed config source.

## H3) Any status string is accepted for moderation endpoint

Evidence:
- `status` validated only as `z.string()`: [backend/src/modules/admin/admin.controller.ts](backend/src/modules/admin/admin.controller.ts#L16)

Impact:
- Invalid moderation state can be persisted.

Fix:
- Restrict to enum `visible | hidden | under-review`.

## H4) Student self-update allows sensitive workflow fields

Evidence:
- User update schema allows `onboardingCompleted` and `currentPlanId`: [backend/src/modules/users/users.schema.ts](backend/src/modules/users/users.schema.ts#L12)
- Student updates are accepted in `PATCH /me`: [backend/src/modules/users/users.controller.ts](backend/src/modules/users/users.controller.ts#L9)

Impact:
- Students can potentially mutate state that should be trainer/admin controlled.

Fix:
- Split self-editable vs privileged fields and enforce role/ownership checks server-side.

## H5) Global protection against abusive traffic is incomplete

Evidence:
- Rate limiter is attached to auth routes only: [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts#L17)

Impact:
- Feed/chat/comments can be spammed under load.

Fix:
- Add route-group/global rate limiting by endpoint category (auth, feed write, chat write, admin).

## 7) Medium Findings

## M1) Feed hydration strategy does not scale in frontend

Evidence:
- Feed page fetches and rewrites full posts map in one shot: [src/pages/student/Feed.tsx](src/pages/student/Feed.tsx#L71)

Impact with large user counts:
- Increased memory usage and long re-render times on lower-end devices.

Fix:
- Cursor-based incremental loading + normalized cached pages.

## M2) No dedicated cache layer for high-read endpoints

Evidence:
- Redis exists but used for rate limiting path only: [backend/src/config/redis.ts](backend/src/config/redis.ts#L1)

Impact:
- DB load scales linearly with traffic for feed/notifications/chat listing.

Fix:
- Add short-lived cache for read-heavy APIs with invalidation on writes.

## M3) Notification retrieval fixed at take 50, no cursor

Evidence:
- Hardcoded `take: 50`: [backend/src/modules/notifications/notifications.service.ts](backend/src/modules/notifications/notifications.service.ts#L8)

Impact:
- Poor UX and loading pressure for long history accounts.

Fix:
- Add cursor + limit in API contract.

## M4) Integration tests are largely service-mocked

Evidence:
- Test suite mocks core services/jwt: [backend/tests/auth-permission-ownership.integration.test.ts](backend/tests/auth-permission-ownership.integration.test.ts#L8)

Impact:
- Real DB and full route-stack regressions can slip through.

Fix:
- Add true DB-backed integration tests using isolated test schema/container.

## M5) Root README is outdated vs actual architecture

Evidence:
- Root README says backend integration intentionally deferred: [README.md](README.md#L8)

Impact:
- Team confusion, onboarding mistakes, wrong deployment assumptions.

Fix:
- Update README to current hybrid frontend-backend reality.

## 8) Scale And Performance Risks For High User Volume

Projected stress points:
1. Feed + profile hydration pattern leads to large payload churn on client.
2. No websocket/SSE path for real-time chat/notifications; likely polling pressure.
3. No cache/read-replica strategy means write and read share primary DB load.
4. No queueing for expensive side effects (notifications, heavy moderation flows).
5. Limited test realism can hide concurrency bugs under load.

Suggested target architecture for 10k+ DAU:
- PostgreSQL primary + optional read replicas
- Redis for cache + distributed rate limits + hot counters
- Object storage + CDN for media (no data URLs in critical flows)
- Queue for async jobs (notifications, analytics, media post-processing)
- Observability stack (request metrics, DB latency, error budgets)

## 9) Verified Quality Status During This Audit

Frontend:
- Lint passes
- Tests pass
- Build passes

Backend:
- Build passes
- Tests pass

Database:
- Runtime Prisma connectivity probe succeeded (`DB_OK`)
- Migration status is clean (`Database schema is up to date`)

## 10) What Is Needed To Make This App Production-Strong

### Phase A (Immediate, 1-3 days)
1. Remove sensitive-field leakage from all API responses.
2. Apply and verify migrations on target Postgres.
3. Fix chat contract: support typed messages and thread creation endpoint.
4. Make frontend logout call backend logout.
5. Lock moderation status to enum.
6. Restrict student profile self-edit fields.

### Phase B (Hardening, 3-7 days)
1. Unify token/cookie/DB expiry using single config parsing.
2. Add global and route-specific rate limits.
3. Add pagination for notifications and feed comments endpoints.
4. Add DB-backed integration tests for core flows.
5. Update root docs to match current backend reality.

### Phase C (Scale, 1-3 weeks)
1. Add Redis caching strategy for read-heavy APIs.
2. Introduce real-time transport (SSE/WebSocket) for chat + notification freshness.
3. Add metrics dashboard and alerting (latency, 5xx, DB pool, queue depth).
4. Add load testing profile and SLO targets.

## 11) Final Verdict

- Is PostgreSQL connected? **Yes, runtime connectivity is confirmed.**
- Is PostgreSQL schema governance healthy? **Yes in current environment; migration state is clean.**
- Are backend files present and complete structurally? **Yes.**
- Is app ready for heavy multi-user production load right now? **No, not yet.**

Primary remaining blockers are scale architecture and deeper production-grade test/caching coverage, not baseline backend wiring.
