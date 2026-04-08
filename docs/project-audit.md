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
