# After Hours Grind

After Hours Grind is a frontend-first fitness accountability platform built for two roles:

1. Student users who execute daily plans, upload progress proof, and track performance.
2. Trainer users who monitor submissions, review student activity, and build plans.

This project is currently focused on complete UI and flow readiness on the frontend. Backend and database integration are intentionally deferred.

## Product Flow Overview

The app has three major stages:

1. Public entry: Landing page, login, and signup.
2. Authenticated role routing: Student area or trainer area based on selected role.
3. Daily usage loops: tracking, posting, reviewing, and progressing through plans.

## Role-Based User Journeys

## Student Journey

1. Auth and entry
- Student signs up or logs in.
- Role is set to student and protected student routes are unlocked.

2. Dashboard
- Student sees summary stats such as streak, steps, rank, completion, and mission preview.
- Quick actions route to upload and community activity.

3. Daily Plan execution
- Student checks workout and nutrition tasks for the day.
- Task completion updates progress state.
- Student can browse day timeline and inspect exercise details.

4. Upload check-in
- Student picks upload type:
	- workout video
	- meal photo
- Student selects a file, previews it, adds caption, location, steps, and tags.
- Submission creates:
	- a trainer-facing submission record
	- a feed post for community view

5. Feed and community
- Student engages with posts, likes, comments, and explores community profiles.
- Student can follow suggested users from community discovery.

6. Performance and achievements
- Student tracks weekly and monthly performance signals.
- Student monitors leaderboard, streaks, and unlocked badges.

7. Profile and settings
- Student edits profile and personal data.
- Notification/privacy preference toggles are persisted locally in browser storage.

## Trainer Journey

1. Auth and entry
- Trainer signs up or logs in.
- Role is set to trainer and protected trainer routes are unlocked.

2. Trainer dashboard
- Trainer sees high-level stats and student submission queue.
- Trainer can search students from the dashboard filter input.

3. Submission review
- Trainer opens pending student submissions.
- Trainer can approve or reject.
- Rejection requires a feedback note.
- Review action updates submission status in global state.

4. Plan Builder
- Trainer configures protocol metadata and day sections.
- Trainer selects target students.
- Publish flow is currently frontend simulated.

## Routing and Access Control

The app uses role-aware protected routes:

1. Public routes
- Landing
- Login
- Signup

2. Student routes
- Dashboard, Daily Plan, Progress, Feed, Upload, Leaderboard, Profile, Community, Notifications, Settings, Achievements

3. Trainer routes
- Dashboard
- Plan Builder

Unauthorized users are redirected to login, and users with the wrong role are redirected to their own role dashboard.

## State and Data Flow

The app currently uses frontend state providers and mock datasets.

1. Auth state
- Maintains user session and selected role.
- Session is persisted in sessionStorage for browser session continuity.

2. App/store state
- Holds student profile, trainer info, tasks, submissions, posts, notifications, leaderboard, and UI loading states.
- Powers all page interactions during frontend-only phase.

3. Settings persistence
- Notification and privacy preferences are stored in localStorage.

## Frontend-Only Scope Right Now

The following areas are intentionally simulated until backend integration:

1. Authentication verification is mock-based and not server validated.
2. File upload uses browser object URLs and does not store media remotely.
3. Feed, submissions, and leaderboards are state-driven with mock source data.
4. Plan publishing and messaging are UI-first with limited persistence.

## Planned Backend Integration Points

When backend is connected, replace these frontend stubs:

1. Auth provider
- Connect login/signup/logout to API endpoints.
- Replace sessionStorage user with token-based auth.

2. Media upload
- Upload files to storage service and persist media URLs in DB.

3. Store actions
- Replace in-memory updates with API mutations and caching.

4. Notifications and messaging
- Add real-time updates via sockets or polling.

5. Role and profile sources
- Fetch role-specific data from server and remove hardcoded assumptions.

## Tech Stack

1. React + TypeScript + Vite
2. React Router for navigation
3. Context-based state management
4. Tailwind-based design system with UI primitives
5. Framer Motion for animation
6. Vitest for unit test setup

## Local Development

1. Install dependencies
npm install

2. Run dev server
npm run dev

3. Run lint
npm run lint

4. Run tests
npm run test

5. Build production bundle
npm run build

## Current Quality Status

1. Frontend role flows are implemented and navigable.
2. Lint has non-blocking warnings to clean up progressively.
3. Tests are currently minimal and should be expanded for core flows.

## Recommended Next Step

Add integration tests for:

1. Role-based login and route protection.
2. Student check-in upload flow.
3. Trainer review and rejection feedback flow.
