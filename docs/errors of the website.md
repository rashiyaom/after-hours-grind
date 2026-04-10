# Errors Of The Website

Date: 2026-04-10
Scope: Deep codebase scan across src, tests, config, and docs for production-critical reliability, security, logical-flow, and incompleteness risks.

## Executive Summary

- The app is frontend-first by design, but current implementation contains several production-blocking risks for large-scale use.
- Most critical risks are in authentication, authorization, persistence model, and client-only trust boundaries.
- Core correctness fixes have been implemented for the highest-risk frontend issues.
- Remaining critical blockers are primarily backend architecture gaps (server-side authz/authn and distributed realtime).

## Remediation Status (Current)

- Fixed:
  - Hardcoded credentials and plaintext password model replaced with hashed password shape (`passwordHash`).
  - Trainer ownership authorization enforced in submission approve/reject flow.
  - Proof media persistence hardened to avoid non-durable blob URL persistence in task-proof paths.
  - Chat persistence bounded and sanitized (thread/message caps and voice payload guardrails).
  - Plan-flow test contract aligned; test suite passes.
  - Lint errors resolved (remaining lint output is warnings only).
  - Storage failure paths now emit one-time warnings instead of silent drops.
  - Additional store IDs moved to centralized ID generation helper; legacy review bridge made idempotent for non-pending submissions.
- Partially mitigated:
  - Client-trust boundaries reduced, but true security still requires backend-enforced session and permission authority.
- Pending (backend required):
  - Server-side source of truth for auth/session/authorization.
  - Multi-device realtime messaging guarantees.
  - Full transactional/idempotent guarantees at API/database layer.

## Critical Issues

### 1) Authentication and authorization are fully client-trusted
- Evidence:
  - `src/hooks/useStore.tsx:1075` (`login` checks local in-memory users only)
  - `src/hooks/useStore.tsx:1140` (`signup` creates users directly in client state)
  - `src/hooks/useStore.tsx:961` and `src/hooks/useStore.tsx:988` (session persisted/read from `localStorage`)
  - `src/hooks/useStore.tsx:904` and `src/hooks/useStore.tsx:922` (permissions persisted/read from `localStorage`)
- Risk at scale:
  - Any user can forge session/permissions in browser storage and bypass role restrictions.
  - No server-side source of truth for access control.
- Failure mode:
  - Unauthorized access to protected routes/actions.

### 2) Hardcoded credentials and plaintext password storage in code and state
- Evidence:
  - `src/hooks/useStore.tsx:815`, `src/hooks/useStore.tsx:820`, `src/hooks/useStore.tsx:825` (hardcoded credentials)
  - `src/types/index.ts:17` (`password` on `User` model)
  - `src/hooks/useStore.tsx:1145` (signup stores plaintext password)
  - `src/data/mockData.ts:21`, `src/data/mockData.ts:80`, `src/data/mockData.ts:111` (plaintext mock passwords)
- Risk at scale:
  - Credential leakage and account compromise.
  - Security/compliance failure (sensitive data stored client-side in plain form).

### 3) High-risk approval flow authorization gap
- Evidence:
  - `src/hooks/useStore.tsx:1602` (`approveTaskSubmission`) and `src/hooks/useStore.tsx:1676` (`rejectTaskSubmission`) only check actor role `trainer|admin`.
  - No ownership validation against `submission.trainerId` or assigned student-trainer mapping.
- Risk at scale:
  - Any trainer account can approve/reject any student submission.
  - Data integrity and trust breakdown in moderated workflow.

### 4) Persistent media architecture is non-durable for proof uploads
- Evidence:
  - `src/pages/student/DailyPlan.tsx:100` (proof preview uses `URL.createObjectURL`)
  - `src/pages/student/DailyPlan.tsx:113` (same preview URL sent as persisted `mediaUrl`)
  - `src/hooks/useStore.tsx:1735` onward (submission/post persisted with provided URL)
- Risk at scale:
  - Blob URLs are session-scoped and break after refresh/restart.
  - Historical proof posts become invalid, moderation/audit trails break.

### 5) Chat/voice data persistence model will fail under heavy usage
- Evidence:
  - `src/pages/student/Community.tsx:32` (`Blob` -> base64 data URL conversion)
  - `src/hooks/useStore.tsx:803` (`chatThreads` persisted to `localStorage`)
  - `src/hooks/useStore.tsx:1905` and `src/hooks/useStore.tsx:1921` (voice notes accepted/stored with URL payload)
- Risk at scale:
  - `localStorage` quota exhaustion with voice messages.
  - Writes fail silently in catch paths, causing dropped chat data and inconsistent UX.

## High Issues

### 6) Failing test indicates logic regression/contract mismatch
- Evidence:
  - `src/test/smart-plan-flow.test.ts:96` expects plan status `active`.
  - Current behavior produces `pending_trainer_approval` (observed test failure in `npm run test`).
- Risk at scale:
  - Business-flow assumptions are drifting.
  - Increases chance of production regressions in onboarding/plan activation paths.

### 7) Lint currently fails (2 errors), blocking quality gate
- Evidence:
  - `src/pages/AthletesPage.tsx:87` uses explicit `any`.
  - `src/pages/LandingPage.tsx:120` uses explicit `any`.
- Risk at scale:
  - Type safety erosion in frequently rendered pages.
  - CI instability if lint is required.

### 8) Legacy and new state systems coexist, causing drift risk
- Evidence:
  - `src/hooks/useStore.tsx` contains both `notifications` and `legacyNotifications`.
  - approval/rejection paths push both arrays at `src/hooks/useStore.tsx:1659` and `src/hooks/useStore.tsx:1703`.
- Risk at scale:
  - Badge counts and notification lists can diverge.
  - Harder debugging and inconsistent user trust.

### 9) Potential points duplication and missing idempotency safeguards
- Evidence:
  - `src/hooks/useStore.tsx:1602` approves by ID and awards points.
  - No explicit guard to stop repeated approvals for already approved submission before award path.
- Risk at scale:
  - Duplicate point awards from repeated action triggers/races.

### 10) Client-only route protection can be bypassed by state mutation
- Evidence:
  - `src/components/ProtectedRoute.tsx:16` relies on store/session data only.
  - `src/lib/routeAccess.ts:16` purely client permission checks.
- Risk at scale:
  - Browser tampering bypasses access restrictions.

### 11) Chat sync is local-device only (not real multi-user distributed real-time)
- Evidence:
  - `src/hooks/useStore.tsx:2136` uses `window.storage` event to sync across tabs.
- Risk at scale:
  - Different devices/users do not truly real-time sync.
  - Messaging consistency expectations fail in real production environments.

## Medium Issues

### 12) Incomplete backend architecture for production usage is explicitly acknowledged
- Evidence:
  - `README.md:8` and `README.md:84` (frontend-only scope, backend deferred).
- Risk:
  - Expected for prototype, but production failure for auth, persistence, media, and messaging reliability.

### 13) Upload workflow for general posts also uses object URL previews as media source
- Evidence:
  - `src/pages/student/UploadPage.tsx:56` (`URL.createObjectURL`) and `src/pages/student/UploadPage.tsx:86` uses preview URL in post.
- Risk:
  - Feed media not durable after refresh/session changes.

### 14) Global store file is highly monolithic and mixes concerns
- Evidence:
  - `src/hooks/useStore.tsx` is very large and includes persistence, auth, permissions, business rules, chat, events, legacy compatibility.
- Risk:
  - Regression probability rises as team/users/features grow.
  - Harder to test and reason about transactional integrity.

### 15) Silent catch blocks on persistence failures hide critical runtime data-loss events
- Evidence:
  - `src/hooks/useStore.tsx:805`, `src/hooks/useStore.tsx:927`, `src/hooks/useStore.tsx:951`, `src/hooks/useStore.tsx:990` all swallow storage write failures.
- Risk:
  - Production failures become invisible to users/operators.
  - Data loss appears as random inconsistencies.

### 16) Non-cryptographic IDs generated from `Date.now` + random fragments
- Evidence:
  - `src/hooks/useStore.tsx:1914` (chat message IDs)
  - multiple `Date.now()` ID generators across store (`src/hooks/useStore.tsx:1142`, `src/hooks/useStore.tsx:1735`, etc.)
- Risk:
  - Collision risk and weaker traceability under high write bursts.

### 17) Hook dependency warning in chat page indicates maintainability risk
- Evidence:
  - ESLint warning from `src/pages/student/Community.tsx:150` (`react-hooks/exhaustive-deps`).
- Risk:
  - Future refactors can reintroduce render loops/stale closures.

### 18) ESLint config disables unused-vars rule globally
- Evidence:
  - `eslint.config.js:21` sets `@typescript-eslint/no-unused-vars` to off.
- Risk:
  - Dead code accumulation and harder long-term maintainability.

## Incomplete / Not Yet Production-Ready Sections

1. Backend auth/token/session validation (currently client-managed).
2. Durable media upload/storage (currently object URLs/data URLs in client flows).
3. True cross-user distributed real-time messaging (currently local tab sync).
4. Server-side authorization enforcement for trainer/student ownership boundaries.
5. Robust transactional/idempotent mutation layer for approvals and points.

## Tooling Results Snapshot

- Build: `npm run -s build` passes (non-blocking warnings remain).
- Lint: passes with warnings; no errors.
- Tests: pass.

## Recommended Priority Order

1. Security baseline hardening:
   - Remove plaintext/hardcoded credentials.
   - Move auth/session/permission checks server-side.
2. Data durability:
   - Replace object/data URLs with uploaded assets and stable URLs.
3. Authorization correctness:
   - Enforce trainer ownership in approve/reject actions.
4. Reliability correctness:
   - Add idempotency checks for approval/points mutation paths.
5. Quality gates:
   - Fix failing test and lint errors, then enforce in CI.

## Notes

This report intentionally includes both true defects and production-readiness gaps that will cause failure under large user load. Some gaps are currently acknowledged by the project as frontend-only, but they remain critical blockers for large-scale deployment.