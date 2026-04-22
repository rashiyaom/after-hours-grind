# Database + Backend Setup Guide (Beginner Friendly)

Date: 2026-04-09
Project: THE afterhour socials

This guide helps you set up a production-friendly backend data system for your app (feed, comments, likes, users, chat, plans, submissions, notifications).

Recommended stack:
- PostgreSQL: main database (source of truth)
- Redis: cache + realtime support (presence, typing, rate limits)
- Object Storage: media files (images/videos)
- Prisma ORM: schema + migrations + type-safe DB access

You will build this in phases so you do not get overwhelmed.

---

## 0) Prerequisites

Install these first:
- Node.js 20+
- npm 10+
- Docker Desktop (optional but recommended for local Postgres/Redis)
- Git
- VS Code

Verify:

```bash
node -v
npm -v
docker -v
git --version
```

---

## 1) Decide Environment Strategy

Pick one path:

1. Local-first (easy for learning, full control)
- Run Postgres + Redis with Docker on your machine.
- Later move to managed services.

2. Managed-first (easy production path)
- Postgres: Supabase or Neon
- Redis: Upstash
- Storage: Cloudflare R2 or Supabase Storage

Recommendation for you now:
- Start Local-first for confidence.
- Move to Managed-first before deployment.

---

## 2) Create Backend Workspace Inside Current Project

From project root, create backend directory:

```bash
mkdir -p backend
cd backend
npm init -y
```

Install backend dependencies:

```bash
npm install express cors helmet dotenv zod jsonwebtoken bcryptjs cookie-parser prisma @prisma/client ioredis
npm install -D typescript tsx @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken @types/bcryptjs
```

Create TypeScript config:

```bash
npx tsc --init
```

Update package scripts in backend/package.json:

```json
{
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 3) Start PostgreSQL + Redis Locally With Docker

Create backend/docker-compose.yml:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: ahg_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ahg
    ports:
      - "5432:5432"
    volumes:
      - ahg_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: ahg_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - ahg_redis_data:/data

volumes:
  ahg_postgres_data:
  ahg_redis_data:
```

Run services:

```bash
docker compose up -d
```

Check healthy:

```bash
docker ps
```

---

## 4) Configure Environment Variables

Create backend/.env:

```env
NODE_ENV=development
PORT=4000

# Postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ahg?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_ACCESS_SECRET="replace_with_long_random_string"
JWT_REFRESH_SECRET="replace_with_long_random_string"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"

# Media storage (fill later when connected)
STORAGE_PROVIDER="local"
STORAGE_BUCKET=""
STORAGE_REGION=""
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""
STORAGE_PUBLIC_BASE_URL=""
```

Important:
- Never commit real secrets.
- Add .env to .gitignore if not already present.

---

## 5) Initialize Prisma

From backend/:

```bash
npx prisma init
```

This creates:
- prisma/schema.prisma
- .env (if not already there)

Use your existing DATABASE_URL from step 4.

Set provider in prisma/schema.prisma:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 6) Create Your Initial Data Model (MVP)

Add these core tables first (minimum for your app):
- User
- StudentProfile
- TrainerProfile
- Follow
- Post
- Comment
- Like
- Plan
- PlanDay
- PlanTask
- Submission
- Notification
- ChatThread
- ChatMessage

Use this as your MVP schema strategy:

1. User and RBAC
- Keep one users table with role enum (student/trainer/admin).
- Store passwordHash only.

2. Feed model
- posts table + comments + likes
- media stored in object storage, DB stores mediaUrl

3. Plan and submission model
- plan -> planDay -> planTask hierarchy
- submission links student + task + media proof + review status

4. Chat model
- chat_threads + chat_messages
- Redis for realtime events, Postgres for message history

Tip:
- Start simple and normalize later.
- Do not over-design v1.

---

## 7) Run First Migration

From backend/:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

Open Prisma Studio to inspect tables:

```bash
npm run prisma:studio
```

---

## 8) Create Seed Script (Default Users + Demo Data)

Why seed matters:
- You can test frontend flows quickly.
- You get reproducible data after resetting DB.

Create seed script with:
- 1 admin
- 1 trainer
- 2 students
- a few posts, comments, likes
- one active plan + sample tasks

Then add script:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:

```bash
npx prisma db seed
```

---

## 9) Build Minimal API Surface (Order Matters)

Implement endpoints in this exact sequence:

1. Auth
- POST /auth/signup
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

2. Profile + users
- GET /me
- PATCH /me
- GET /users/:id

3. Feed
- GET /feed
- POST /posts
- POST /posts/:id/comments
- POST /posts/:id/likes
- DELETE /posts/:id/likes

4. Follows
- POST /users/:id/follow
- DELETE /users/:id/follow

5. Plans + submissions
- GET /student/plan/today
- POST /submissions
- POST /submissions/:id/approve (trainer/admin)
- POST /submissions/:id/reject (trainer/admin)

6. Notifications
- GET /notifications
- POST /notifications/:id/read

7. Chat
- GET /threads
- GET /threads/:id/messages
- POST /threads/:id/messages

---

## 10) Add Auth + RBAC Middleware

Required middleware:
- requireAuth: validates JWT access token
- requireRole: checks role (student/trainer/admin)
- requirePermission: for fine-grained permissions if needed later

Backend must enforce ownership checks, for example:
- trainer can approve only assigned student submissions
- user can edit only own profile/posts (unless admin)

Do not trust frontend checks alone.

---

## 11) Add Storage For Media

Current frontend uses data URLs/object URLs. Replace with real upload flow.

Production flow:
1. Frontend asks backend for upload URL
2. Backend returns pre-signed URL
3. Frontend uploads file directly to storage
4. Frontend sends final file URL in create-post/create-submission API

Endpoints:
- POST /uploads/presign

Store in DB:
- mediaUrl
- mediaType
- optional metadata (size, mimeType, duration)

---

## 12) Use Redis For Realtime + Performance

Use Redis for:
- Presence status (online/offline)
- Typing indicators in chat
- Rate limiting (auth, comments, likes)
- Cached feed pages (short TTL)
- Pub/Sub for websocket events

Do not store critical business truth only in Redis.
Postgres remains source of truth.

---

## 13) Add Reliability Guardrails Early

Must-have now:
- DB transactions for multi-step operations (approve submission + points + notification)
- Idempotency keys for sensitive mutations
- Unique constraints to prevent duplicate likes/follows
- Input validation with zod
- Central error handling middleware
- Structured logs

Example constraints:
- unique(userId, postId) on likes
- unique(followerId, followingId) on follows

---

## 14) Connect Frontend Incrementally

Replace store methods one module at a time, not all at once.

Suggested migration order:
1. auth
2. feed + comments + likes
3. submissions + review
4. notifications
5. chat

For each module:
- implement API
- switch frontend action
- keep fallback disabled once stable
- add tests

---

## 15) Testing Checklist

Backend tests:
- auth happy + failure paths
- RBAC and ownership checks
- duplicate-like/follow prevention
- submission approval idempotency

Integration tests:
- student uploads proof -> trainer approves -> points updated once
- feed pagination and comment creation
- chat send/read history

Load tests (basic):
- feed read endpoint
- comment burst endpoint
- chat message write endpoint

---

## 16) Move To Managed Services (When Ready)

Swap local to managed:
- Postgres local -> Supabase/Neon
- Redis local -> Upstash
- local storage -> S3/R2

Only change:
- environment variables
- storage adapter config

Keep same Prisma schema and app code as much as possible.

---

## 17) Deployment Starter Plan

1. Deploy backend API (Railway/Render/Fly.io)
2. Configure managed Postgres + Redis + Storage
3. Run migrations in production
4. Set secure environment variables
5. Enable monitoring and alerts

Do before public release:
- rotate secrets
- enforce HTTPS-only cookies or secure token handling
- configure CORS to your frontend domains only

---

## 18) Common Beginner Mistakes (Avoid These)

1. Storing plaintext passwords
- Always hash with bcrypt/argon2.

2. Putting media binary in Postgres
- Store files in object storage, URL in DB.

3. Skipping unique constraints
- Causes duplicate likes/follows and dirty data.

4. Trusting frontend role checks
- Always re-check on backend.

5. Editing schema directly in production
- Always use Prisma migrations.

---

## 19) Definition Of Done (MVP Backend)

You are done with v1 backend when all are true:
- Users can signup/login securely
- Student feed is DB-backed
- Comments and likes persist correctly
- Submission approval flow is server-enforced and transactional
- Chat history persists in Postgres
- Media is uploaded to object storage
- Frontend no longer depends on localStorage as business source of truth

---

## 20) Your Next 5 Commands (Right Now)

Run these from project root:

```bash
cd backend
npm init -y
npm install express cors helmet dotenv zod jsonwebtoken bcryptjs cookie-parser prisma @prisma/client ioredis
npm install -D typescript tsx @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken @types/bcryptjs
npx prisma init
```

Then continue with Step 3 in this doc.

---

## Optional: If You Want Me To Continue

I can generate these next files for you in backend/:
- src/server.ts
- src/app.ts
- src/config/env.ts
- src/modules/auth/*
- prisma/schema.prisma (first working version)
- prisma/seed.ts

Say: "create backend starter now" and I will scaffold it in your workspace.
