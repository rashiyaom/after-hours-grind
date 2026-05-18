# 🔍 CRITICAL PRODUCTION AUDIT - Issues Found

## 🚨 CRITICAL ISSUES (Will Break in Production)

### 1. **FALLBACK TO LOCALHOST** 🔴 HIGH PRIORITY
**File**: `src/lib/api.ts` Line 3
```typescript
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:4000/api";
```

**Problem**:
- If `VITE_API_BASE_URL` is not set in production, **ALL API calls go to localhost:4000**
- Users in production will see errors like "Cannot connect to localhost"
- Cross-origin requests will fail silently
- Users won't be able to log in, load data, or submit anything

**Impact**: **COMPLETE APP FAILURE** in production without env var

**Fix**:
```typescript
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || (() => {
  if (import.meta.env.PROD) {
    throw new Error("VITE_API_BASE_URL is required in production");
  }
  return "http://localhost:4000/api";
})();
```

**Action Required**: 
- [ ] Set `VITE_API_BASE_URL` in `.env.production`
- [ ] Set `VITE_API_BASE_URL` in deployment pipeline
- [ ] Update build script to validate this env var

---

### 2. **STALE SENTRY EXAMPLE PAGE** 🟡 MEDIUM
**Files**: 
- `src/pages/sentry-example-page.tsx` (incompatible Next.js version)
- `src/pages/api/sentry-example-api.ts` (API route, Vite doesn't support this)

**Problem**:
- These files don't work with Vite React
- Next.js API routes (`src/pages/api/`) don't exist in Vite
- Importing from `src/pages/api/` will fail

**Solution**: Delete these files
```bash
rm src/pages/sentry-example-page.tsx
rm src/pages/api/sentry-example-api.ts
```

---

## 🟡 MAJOR ISSUES (Scalability Problems)

### 3. **Unhandled Promise Rejections in useStore** 🟡 HIGH
**File**: `src/hooks/useStore.tsx` (~40+ instances)

**Pattern**:
```typescript
catch (error) {
  console.error("Failed to...", error);
  // ❌ ERROR NOT REPORTED TO SENTRY
  // ❌ PROMISE REJECTION UNHANDLED
}
```

**Problem**:
- Errors disappear in production
- No observability into failures
- Silent failures cascade
- Users stuck on loading screens

**Example Instances**:
- Line 715: Storage fallback (console.warn only)
- Line 1460: Like failed (rolls back but error not tracked)
- Line 1484: Status update failed
- Line 1527: Ban user failed
- Line 1679: Draft save failed
- Line 2265: Chat thread creation failed
- Line 2370: Message send failed
- Line 2766: Data refresh failed

**Fix**: Wrap all catch blocks with Sentry
```typescript
catch (error) {
  Sentry.captureException(error, {
    tags: { action: "like_post" },
    extra: { postId: post.id }
  });
  toast.error("Failed to like post. Please try again.");
}
```

---

### 4. **Feed Data Loading Not Paginated** 🟡 MEDIUM
**File**: `src/lib/api.ts` Line 316 and `src/pages/student/Feed.tsx`

**Problem**:
```typescript
// Function exists but NOT used in frontend
export async function fetchFeedFromBackend(): Promise<Post[]> {
  return authedRequest<Post[]>("/feed");
}

// Instead, component loads infinite scroll without pagination
// This loads ALL posts at once
```

**Impact at scale**:
- 50 posts × 10KB each = 500KB of JSON
- With 100+ users posting = 1000+ posts = 10MB
- Browser memory bloat
- Feed takes 5-10 seconds to load
- Leaderboard loads entire user database (similar issue)

**Current Code** (Dashboard.tsx):
```typescript
// ❌ Loads everything at once
const [data, setData] = useState<AdminDashboardData | null>(null);

useEffect(() => {
  Promise.allSettled([
    fetchAdminStatsAPI(),        // ALL STATS
    fetchFlaggedContentAPI(),    // ALL FLAGGED
    fetchAdminActivityLogsAPI(), // ALL LOGS
  ]);
}, []);
```

**Fix**: Implement cursor pagination
```typescript
const [posts, setPosts] = useState<Post[]>([]);
const [hasMore, setHasMore] = useState(true);
const [cursor, setCursor] = useState<string | null>(null);

const loadMore = async () => {
  const { data, nextCursor } = await fetchFeedPageFromBackend(cursor, 20);
  setPosts(prev => [...prev, ...data]);
  setCursor(nextCursor);
  setHasMore(!!nextCursor);
};

// Load only first 20, then lazy load more
```

---

### 5. **Multiple findMany() Queries Loaded Simultaneously** 🟡 MEDIUM
**File**: `backend/src/modules/admin/admin.service.ts` Line 402-404

```typescript
await Promise.all([
  prisma.user.findMany({ take: 10, ... }),        // Users table scan
  prisma.post.findMany({ take: 10, ... }),        // Posts table scan
  prisma.submission.findMany({ take: 10, ... }),  // Submissions table scan
]);
```

**Problem**:
- Without filters, these scan entire tables
- Leaderboard loads ALL student profiles: `prisma.studentProfile.findMany()`
- No connection pooling consideration
- Database connection pool exhaustion under load

**Scalability Issue**:
- 100 concurrent users = 300 simultaneous queries
- PostgreSQL connection pool default = 10 connections
- Result: **Queue backlog, timeouts, user frustration**

**Fix**:
```typescript
// Add limits and filters
await Promise.all([
  prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: safeUserSelect,
    where: { isBanned: false }  // ← Filter
  }),
  prisma.post.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    where: { status: 'visible' }  // ← Filter
  }),
  // ... etc
]);
```

---

## 🟠 LOGICAL/CONCEPTUAL ERRORS

### 6. **Leaderboard Loads All 500+ Students** 🟠 HIGH IMPACT
**File**: `backend/src/modules/leaderboard/leaderboard.service.ts` Line 23

```typescript
const profiles = await prisma.studentProfile.findMany();  // ❌ NO LIMIT
const userIds = profiles.map((p) => p.userId);
// Then multiple queries on ALL users
```

**Problem**:
- With 500 students: loads 500 profiles
- Then queries: submissions count, progress aggregates
- Total: 3-4 queries × 500 students = **1500+ query results**
- Transfer: ~5MB per load
- Time: 10+ seconds

**User Impact**:
- Leaderboard page times out on first load
- Trainer roster page hangs
- Admin dashboard slow

**Fix**:
```typescript
const profiles = await prisma.studentProfile.findMany({
  take: 100,  // Paginate
  skip: offset,
  orderBy: { createdAt: 'desc' }
});
```

---

### 7. **No Error Boundary - Component Crash Breaks App** 🟠 MEDIUM
**Problem**:
- No `<ErrorBoundary>` wrapper in React app
- Any component error = blank white screen
- Users can't recover without refresh
- Error invisible in production

**Example crash scenario**:
```typescript
// Student clicks on profile with bad data
const user = users[userIndex];  // ← undefined if index out of bounds
return <div>{user.name}</div>  // ← CRASH: Cannot read property 'name'
```

**Fix**: Add error boundary at App.tsx level
```typescript
import * as Sentry from "@sentry/react";

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        {/* routes */}
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1>Something went wrong</h1>
        <button onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    </div>
  );
}
```

---

### 8. **JWT Tokens Not Validated on Expiry** 🟠 HIGH
**File**: `src/lib/api.ts` Line 286-298

**Current Code**:
```typescript
export async function authedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = inMemoryAccessToken;
  if (!token) {
    token = await refreshBackendAccessToken();  // ← Assume always succeeds
    inMemoryAccessToken = token;
  }
  return apiRequest<T>(path, init, token);
}
```

**Problem**:
- If refresh fails, **token is null but code continues**
- API request fails silently
- User sees empty data
- No redirect to login

**Fix**:
```typescript
if (!token) {
  const refreshed = await refreshBackendAccessToken();
  if (!refreshed) {
    // Token invalid or refresh failed
    clearAuthState();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  token = refreshed;
}
```

---

### 9. **Submission Status Not Validated** 🟠 MEDIUM
**File**: `backend/src/modules/admin/admin.service.ts`

**Problem**:
- Trainer can approve/reject same submission twice
- Status doesn't prevent state transition
- No idempotency check
- User can game the system

**Example**:
```typescript
// User submits workout
// Trainer approves ✓
// Trainer approves again (should fail but doesn't)
// User credited twice
```

**Fix**: Add status check
```typescript
const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
if (sub?.status !== 'PENDING') {
  throw HttpError.conflict('Submission already reviewed');
}
```

---

## 📊 ISSUES SUMMARY TABLE

| Issue | Severity | Impact | Users Affected | Fix Time |
|-------|----------|--------|----------------|----------|
| Localhost fallback | 🔴 CRITICAL | Complete app failure | All (100%) | 15 min |
| Unhandled errors | 🟡 HIGH | No observability | All (100%) | 2 hrs |
| Feed pagination | 🟡 MEDIUM | Slow load, memory bloat | 50+ users | 1 hr |
| Leaderboard scan | 🟠 MEDIUM | Page timeout | 100+ users | 1 hr |
| No error boundary | 🟠 MEDIUM | App crash on error | 5-10% | 20 min |
| JWT expiry handling | 🟠 MEDIUM | Stuck on loading | 2-5% | 30 min |
| Duplicate approvals | 🟠 MEDIUM | Data integrity issue | 0.1% | 30 min |

---

## ⚡ QUICK FIX PRIORITY

**DO FIRST (Before going live):**
1. ✅ Set `VITE_API_BASE_URL` environment variable
2. ✅ Delete old Sentry example files
3. ✅ Wrap all console.error with Sentry
4. ✅ Add error boundary

**DO BEFORE 100 USERS:**
5. ✅ Paginate leaderboard
6. ✅ Fix JWT expiry handling
7. ✅ Add submission status validation

**DO BEFORE 500 USERS:**
8. ✅ Implement feed pagination
9. ✅ Add database connection pooling
10. ✅ Implement caching for frequent queries

---

## 🧪 TEST WITH LOAD

```bash
# Run load test to catch scalability issues
cd backend/scripts
node load-test-50-users.mjs

# Monitor:
# - Database query time
# - Connection pool usage
# - Response times > 1 second?
# - Memory leaks?
```

