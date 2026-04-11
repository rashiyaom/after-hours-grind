# After Hours Grind

After Hours Grind is a full-stack fitness accountability platform built for two roles:

1. Student users who execute daily plans, upload progress proof, and track performance.
2. Trainer users who monitor submissions, review student activity, and build plans.

The project now includes an Express + Prisma backend connected to PostgreSQL, with API flows for authentication, feed, plans/submissions, events, chat, notifications, and admin controls.

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

The app uses a hybrid model: backend APIs for core persisted flows plus frontend compatibility layers for selected legacy UX paths.

1. Auth state
- Uses backend login/signup/refresh/logout endpoints.
- Access token is kept in memory and refresh is cookie-based.

2. App/store state
- Holds role-specific UI state and mirrors backend data for feed, plans, submissions, chat, and events.
- Supports offline/development-safe fallbacks when backend is unavailable.

3. Settings persistence
- Notification and privacy preferences are stored in localStorage.

## Current Integration Scope

Server-backed today:

1. Auth/session APIs
2. Feed + comments + likes
3. Plan submissions + trainer/admin review
4. Events + registration
5. Chat threads/messages
6. Notifications and admin moderation routes

Still pending full production hardening:

1. Media object storage + CDN for uploads
2. Real-time transport (SSE/WebSocket) for high-scale chat/notification freshness
3. Expanded DB-backed integration tests for non-happy paths and load behavior

## Tech Stack

1. React + TypeScript + Vite
2. React Router for navigation
3. Zustand store with backend synchronization
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

1. Frontend build, tests, and lint run successfully.
2. Backend build and integration test suite run successfully.
3. Prisma schema and migration files are present for PostgreSQL lifecycle management.

## Recommended Next Step

Add integration tests for:

1. Role-based login and route protection.
2. Student check-in upload flow.
3. Trainer review and rejection feedback flow.
