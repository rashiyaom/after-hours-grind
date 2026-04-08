# Project Audit

This document outlines critical issues, vulnerabilities, incomplete parts, and incorrect logic flows found in the project.

## Incomplete Items

### 1. Document Title Not Set

- **File:** `index.html`
- **Line:** 7
- **Description:** The document title is a placeholder and should be set to the actual application name.
- **Criticality:** Low
- **Recommendation:** Update the `<title>` tag in `index.html`.

## Code Smells & Refactoring Opportunities

### 1. Massive Store with Mixed Concerns

- **File:** `src/hooks/useStore.tsx`
- **Description:** The `useAppStore` Zustand store is a monolith that handles almost all application state. It mixes state management with business logic (e.g., `adaptTodayTaskForProfile`, `buildTodayTaskFromPlan`) and mock data definitions.
- **Criticality:** Medium
- **Recommendation:**
    -   Split the store into smaller, feature-specific stores (e.g., `useUserStore`, `usePlanStore`, `useSessionStore`).
    -   Extract business logic into separate utility files or services (e.g., in the `src/lib` directory).
    -   Move mock data definitions to dedicated files in the `src/data` directory.

### 2. Legacy Data Structures

- **Files:** `src/hooks/useStore.tsx`, `src/types/index.ts`
- **Description:** The codebase contains several "legacy" types and data structures (e.g., `LegacyTodayTask`, `LegacySubmission`). This indicates a mix of old and new systems, which can cause confusion, increase maintenance overhead, and lead to bugs.
- **Criticality:** Medium
- **Recommendation:** Plan and execute a migration strategy to replace all legacy types and logic with their modern counterparts. Ensure data consistency during the transition.

## Security Vulnerabilities

### 1. Hardcoded Credentials

- **File:** `src/hooks/useStore.tsx`
- **Description:** The `hardcodedRoleCredentials` object contains plaintext emails and passwords for different user roles. This is a severe security vulnerability.
- **Criticality:** **Critical**
- **Recommendation:**
    -   Immediately remove these hardcoded credentials from the source code.
    -   Use environment variables for any sensitive information.
    -   For authentication, implement a proper authentication flow using a secure service (e.g., OAuth, JWT with a backend). Never store plaintext passwords.

## Task Proof Flow Findings (Post-Fix)

### 1. Streak Inflation Risk on Multi-Task Approval

- **File:** `src/hooks/useStore.tsx`
- **Description:** Streak increments on every approved submission. If a student gets multiple task proofs approved in a day, streak can increase multiple times for the same day.
- **Criticality:** High
- **Recommendation:** Track streak by calendar day and increment at most once per day.

### 2. Client-Only Media URLs for Proof Posts

- **Files:** `src/pages/student/DailyPlan.tsx`, `src/hooks/useStore.tsx`
- **Description:** Proof posts use local object URLs (`blob:`) as media source. These are session-scoped and will break after refresh/reload.
- **Criticality:** High
- **Recommendation:** Upload proof media to persistent storage and store permanent URLs before creating posts/submissions.

### 3. Approval Path Can Be Bypassed Through Direct Store API Usage

- **File:** `src/hooks/useStore.tsx`
- **Description:** `completeTask` remains available and can still mark tasks complete without proof/approval if called by future UI code.
- **Criticality:** Medium
- **Recommendation:** Gate `completeTask` behind server-side approval state or make it internal/private to approval handlers only.

### 4. Dual Notification Sources Cause Inconsistent Badges

- **Files:** `src/layouts/AppLayout.tsx`, `src/hooks/useStore.tsx`, `src/pages/student/Notifications.tsx`
- **Description:** Notification count and notification list are sourced from different arrays (`system.notifications` vs `legacyNotifications`), which can drift.
- **Criticality:** Medium
- **Recommendation:** Consolidate to one notification model and derive UI badges/lists from a single source of truth.

### 5. Rejected Proof Posts Stay in Under-Review Status

- **File:** `src/hooks/useStore.tsx`
- **Description:** On rejection, linked proof post remains `under-review` instead of moving to an explicit rejected/hidden state.
- **Criticality:** Low
- **Recommendation:** Introduce a dedicated rejected post state (or map rejection to hidden) and surface clear status in the student feed.
