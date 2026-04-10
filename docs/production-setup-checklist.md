# Production Setup Checklist

This checklist covers infrastructure provisioning and deployment steps for the full app.

## 1) Provision Infrastructure

1. Provision PostgreSQL (recommended: Neon managed Postgres).
2. Provision Redis for shared rate limiting and cache behavior (recommended: Upstash/Redis Cloud).
3. Provision frontend hosting (Vercel/Netlify/Cloudflare Pages).
4. Provision backend hosting (Render/Fly.io/Railway/VM + reverse proxy).

## 2) Create Production URLs

1. Frontend URL, e.g. `https://app.example.com`.
2. Backend URL, e.g. `https://api.example.com`.
3. Configure frontend `VITE_API_BASE_URL` to backend URL + `/api`.

## 3) Configure Backend Environment Variables

Based on `backend/.env.example`:

1. `NODE_ENV=production`
2. `DATABASE_URL=<production postgres connection string>`
3. `REDIS_URL=<production redis url>`
4. `JWT_ACCESS_SECRET=<long random secret>`
5. `JWT_REFRESH_SECRET=<long random secret>`
6. `ACCESS_TOKEN_TTL=15m`
7. `REFRESH_TOKEN_TTL=7d`
8. `CORS_ORIGINS=https://app.example.com`
9. `TRUST_PROXY=true` when deployed behind reverse proxy/load balancer
10. `AUTH_COOKIE_SAME_SITE=lax` for same-site domain setup
11. `AUTH_COOKIE_SAME_SITE=none` for different top-level frontend/backend domains
12. `AUTH_COOKIE_DOMAIN=.example.com` if you need shared subdomain cookies

## 4) Apply Migrations in Deploy Pipeline

1. Ensure migration history exists under `backend/prisma/migrations`.
2. Run `npm run prisma:migrate:deploy` before backend start.
3. Do not run seed in production unless explicitly needed.

Example deploy sequence:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm start
```

## 5) Verify HTTPS and Cookie Behavior

1. Use HTTPS for frontend and backend.
2. Confirm auth cookies are marked `Secure` in production.
3. If frontend and backend are cross-site, use `AUTH_COOKIE_SAME_SITE=none` and HTTPS.
4. Verify login -> refresh -> logout works in browser.

## 6) CI/CD Validation

CI is configured in `.github/workflows/ci.yml` and should validate:

1. Lint
2. Frontend tests
3. Backend integration tests
4. Frontend build
5. Backend build

## 7) Post-Deploy Smoke Tests

1. `GET /api/health` returns ok.
2. Login flow works and sets cookies.
3. Protected routes reject unauthenticated requests.
4. Role-protected routes enforce permissions.
5. Trainer submission ownership restrictions are enforced.
6. Event registration requires authentication.

## 8) Recommended Next Improvements

1. Replace in-memory rate limiter with Redis-backed distributed limiter.
2. Remove phased lint `any` exceptions incrementally.
3. Add readiness endpoint that verifies DB/Redis connectivity.
4. Add monitoring/alerting for 5xx spikes and auth failures.
