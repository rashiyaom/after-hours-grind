# PRODUCTION FIX GUIDE - Critical Issues & Code Changes

## 🔴 CRITICAL FIX #1: N+1 Query Problem in Admin Service

**File**: `backend/src/modules/admin/admin.service.ts`  
**Lines**: 993-1010, 1139-1151  
**Time to fix**: 30 minutes  
**Impact**: 100x performance improvement for bulk operations

### ISSUE LOCATION #1: Exercise Template Assignment Loop

**Current Code** (Lines 993-1010):
```typescript
for (const studentId of payload.studentIds) {
  const student = await prisma.user.findUnique({ 
    where: { id: studentId }, 
    select: { id: true, role: true, name: true } 
  }); // ← QUERY #1 per student
  
  if (!student || student.role !== "STUDENT") {
    continue;
  }

  await prisma.$executeRawUnsafe(
    `DELETE FROM exercise_template_assignment 
     WHERE student_id = $1 AND day_number = $2 AND template_id = $3`,
    studentId,
    payload.dayNumber,
    payload.templateId,
  ); // ← QUERY #2 per student

  let resolvedSortOrder = payload.sortOrder && payload.sortOrder > 0 
    ? Math.floor(payload.sortOrder) : null;
  
  if (resolvedSortOrder) {
    await prisma.$executeRawUnsafe(
      `UPDATE exercise_template_assignment 
       SET sort_order = sort_order + 1, updated_at = NOW() 
       WHERE student_id = $1 AND day_number = $2 AND sort_order >= $3`,
      studentId,
      payload.dayNumber,
      resolvedSortOrder,
    ); // ← QUERY #3 per student
  }
}
```

**With 50 students**: 150 database queries ❌  
**Expected**: 3-4 queries ✅

### FIXED CODE #1:

```typescript
// Step 1: Get all students in one query
const students = await prisma.user.findMany({
  where: {
    id: { in: payload.studentIds },
    role: "STUDENT",
  },
  select: { id: true },
});

const validStudentIds = students.map(s => s.id);

if (validStudentIds.length === 0) {
  throw HttpError.badRequest("No valid students found");
}

// Step 2: Bulk delete in ONE query
await prisma.$executeRawUnsafe(
  `DELETE FROM exercise_template_assignment 
   WHERE student_id = ANY($1::uuid[]) 
   AND day_number = $2 
   AND template_id = $3`,
  validStudentIds,
  payload.dayNumber,
  payload.templateId,
);

// Step 3: Bulk update in ONE query
const resolvedSortOrder = payload.sortOrder && payload.sortOrder > 0 
  ? Math.floor(payload.sortOrder) 
  : null;

if (resolvedSortOrder) {
  await prisma.$executeRawUnsafe(
    `UPDATE exercise_template_assignment 
     SET sort_order = sort_order + 1, updated_at = NOW() 
     WHERE student_id = ANY($1::uuid[]) 
     AND day_number = $2 
     AND sort_order >= $3`,
    validStudentIds,
    payload.dayNumber,
    resolvedSortOrder,
  );
}

// Step 4: Batch create assignments
const assignmentsToCreate = validStudentIds.map((studentId, index) => ({
  student_id: studentId,
  day_number: payload.dayNumber,
  template_id: payload.templateId,
  sort_order: payload.sortOrder ?? (index + 1),
  created_at: new Date(),
  updated_at: new Date(),
}));

if (assignmentsToCreate.length > 0) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO exercise_template_assignment 
     (student_id, day_number, template_id, sort_order, created_at, updated_at) 
     VALUES ${assignmentsToCreate.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6})`).join(', ')}`,
    ...assignmentsToCreate.flatMap(a => [
      a.student_id, a.day_number, a.template_id, a.sort_order, a.created_at, a.updated_at
    ])
  );
}

// Build summary
const summary = validStudentIds.map((studentId, i) => ({
  studentId,
  appliedToPlan: true,
  sortOrder: payload.sortOrder ?? (i + 1),
}));

return { summary };
```

### ISSUE LOCATION #2: Nested Assignment Loops (Lines 1139-1151)

**Current Code**:
```typescript
for (const student of validStudents) {           // ← Loop 1
  for (const dayPlan of normalizedDayPlans) {    // ← Loop 2
    // Inside nested loop: execute query
    for (let index = 0; index < dayPlan.templateIds.length; index += 1) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO exercise_template_assignment (...) VALUES (...)`,
        student.id,
        // ... multiple parameters
      ); // ← This runs 1,000+ times!
    }
  }
}
```

**With 50 students × 7 days × 5 templates**: 1,750 queries ❌

### FIXED CODE #2:

```typescript
// Flatten everything into a single bulk insert
const allAssignments: Array<{
  student_id: string;
  day_number: number;
  template_id: string;
  sort_order: number;
}> = [];

for (const student of validStudents) {
  for (const dayPlan of normalizedDayPlans) {
    for (let index = 0; index < dayPlan.templateIds.length; index++) {
      allAssignments.push({
        student_id: student.id,
        day_number: dayPlan.dayNumber,
        template_id: dayPlan.templateIds[index],
        sort_order: index + 1,
      });
    }
  }
}

if (allAssignments.length > 0) {
  // Single bulk insert
  const placeholders = allAssignments
    .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `INSERT INTO exercise_template_assignment 
     (student_id, day_number, template_id, sort_order) 
     VALUES ${placeholders}`,
    ...allAssignments.flatMap(a => [
      a.student_id, a.day_number, a.template_id, a.sort_order
    ])
  );
}

return {
  totalAssigned: allAssignments.length,
  students: validStudents.length,
  daysPerStudent: normalizedDayPlans.length,
};
```

---

## 🔴 CRITICAL FIX #2: Error Tracking Setup

**Time**: 30 minutes setup + 1-2 hours replacing console logs  
**Tools**: Sentry (recommended for startups)

### Step 1: Install Sentry

**Backend**:
```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

**Frontend**:
```bash
npm install @sentry/react
```

### Step 2: Initialize Sentry in Backend

**File**: `backend/src/config/sentry.ts` (new file)

```typescript
import * as Sentry from "@sentry/node";
import { env } from "./env";

export function initSentry() {
  if (env.NODE_ENV !== "production" || !env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });
}

export function setupSentryErrorHandler(app: Express.Application) {
  app.use(Sentry.Handlers.errorHandler());
}
```

**File**: `backend/src/server.ts` (add initialization)

```typescript
import { initSentry, setupSentryErrorHandler } from "./config/sentry";

// Early in server startup
initSentry();

// ... create app ...

// Before error handlers
setupSentryErrorHandler(app);

// In error catch block
catch (error) {
  if (env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      tags: {
        context: "server-startup",
      },
    });
  }
  throw error;
}
```

### Step 3: Initialize Sentry in Frontend

**File**: `src/main.tsx` (modify)

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Initialize early
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
  });
}

const Router = Sentry.withSentryRouting(createBrowserRouter);

// Wrap app
const App = () => (
  <Router routes={routes} />
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 4: Replace Console.error Calls

**OLD** (in any service):
```typescript
try {
  await fetchUserData();
} catch (error) {
  console.error("Failed to load user:", error);  // ❌
  toast.error("Could not load profile");
}
```

**NEW**:
```typescript
import * as Sentry from "@sentry/react";

try {
  await fetchUserData();
} catch (error) {
  Sentry.captureException(error, {
    tags: { 
      feature: "user-profile",
      severity: "medium"
    },
    extra: {
      userId: currentUser?.id,
    }
  });
  toast.error("Could not load profile");
}
```

### Step 5: Add Environment Variables

**backend/.env.example**:
```
SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
```

**frontend/.env.example**:
```
VITE_SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
```

---

## 🟡 FIX #3: Remove Console Logs

### Search & Replace Pattern

**Files to clean** (use find & replace):
- [src/hooks/useStore.tsx](src/hooks/useStore.tsx)
- [src/pages/admin/UserManagement.tsx](src/pages/admin/UserManagement.tsx)
- [src/pages/student/Settings.tsx](src/pages/student/Settings.tsx)

**Pattern 1**: Replace error logs
```
OLD: console.error("(.+?)", (.+?));
NEW: Sentry.captureException($2, { tags: { msg: "$1" } });
```

**Pattern 2**: Replace warning logs
```
OLD: console.warn("(.+?)");
NEW: Sentry.captureMessage("$1", "warning");
```

---

## 🟡 FIX #4: Fix CORS Default & Production Guards

**File**: `backend/src/config/env.ts`

```typescript
// BEFORE
CORS_ORIGINS: z.string().default("http://localhost:5173"),

// AFTER
CORS_ORIGINS: z.string()
  .default(() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CORS_ORIGINS must be explicitly set in production");
    }
    return "http://localhost:5173";
  })
  .refine(
    (val) => {
      if (process.env.NODE_ENV === "production") {
        return !val.includes("localhost") && !val.includes("127.0.0.1");
      }
      return true;
    },
    "CORS_ORIGINS cannot point to localhost in production"
  ),
```

**File**: `backend/prisma/seed.ts` (add at top)

```typescript
// Add this as first line in main() function
if (process.env.NODE_ENV === "production") {
  console.error("❌ Database seeding is not allowed in production!");
  console.error("This would overwrite your production data.");
  process.exit(1);
}
```

---

## 🟡 FIX #5: Feed Pagination

**File**: `backend/src/modules/feed/feed.service.ts` (example fix)

```typescript
// Add pagination support
async getFeed(userId: string, limit = 20, cursor?: string) {
  const where: Prisma.PostWhereInput = {
    status: { not: "hidden" },
    // ... existing filters
  };

  const posts = await prisma.post.findMany({
    where,
    take: limit + 1,  // Get one extra to determine hasMore
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit);
  const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

  return {
    data: items,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  };
}
```

**Frontend usage**:
```typescript
const [cursor, setCursor] = useState<string | null>(null);

const loadMore = async () => {
  const response = await fetch(
    `/api/feed?limit=20${cursor ? `&cursor=${cursor}` : ""}`
  );
  const { data, nextCursor, hasMore } = await response.json();
  
  setFeed(prev => [...prev, ...data]);
  setCursor(nextCursor);
  setHasMore(hasMore);
};
```

---

## ✅ DEPLOYMENT ENVIRONMENT SETUP

### Required Environment Variables (Production)

**backend/.env (production)**:
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@prod-db.neon.tech/maindb
DATABASE_READ_URL=postgresql://user:pass@prod-db-replica.neon.tech/maindb
REDIS_URL=redis://default:pass@redis.upstash.io:39000
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
CORS_ORIGINS=https://app.example.com,https://www.example.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
TRUST_PROXY=true
```

**frontend/.env (production)**:
```bash
VITE_API_BASE_URL=https://api.example.com/api
VITE_SENTRY_DSN=https://YOUR_KEY@sentry.io/FRONTEND_PROJECT_ID
```

---

## 📋 VALIDATION AFTER FIXES

### Test Query Performance

```bash
# In backend
npm run dev

# In another terminal, test the fixed endpoint
curl -X POST http://localhost:4000/api/admin/assign-templates \
  -H "Content-Type: application/json" \
  -d '{
    "studentIds": ["id1", "id2", "id3", ...], 
    "templateId": "template1",
    "dayNumber": 1
  }'

# Should complete in <500ms instead of 10+ seconds
```

### Verify Error Tracking

1. Go to `https://sentry.io/organizations/your-org/`
2. Create test error: `throw new Error("Test error from app")`
3. Check Sentry dashboard - error should appear within 10 seconds

### Check Console Logs Removed

```bash
# Search for remaining console logs
grep -r "console\.error\|console\.warn" src/ backend/src/ --include="*.tsx" --include="*.ts" | grep -v "test\|spec"
# Should return: (no results)
```

---

## 🚀 ROLLOUT TIMELINE

**Day 1**: Fix N+1 queries (30 min) + Test (1 hour) = 1.5 hours ✅
**Day 2**: Setup Sentry (1 hour) + Replace logs (1.5 hours) = 2.5 hours ✅
**Day 3**: Fix CORS/Seed guards (30 min) + Pagination (1 hour) = 1.5 hours ✅
**Day 4**: Full integration test + staging deploy (4 hours) ✅
**Day 5**: Production deployment + monitoring (2 hours) ✅

**Total**: ~11 hours development = Ready for production ✅
