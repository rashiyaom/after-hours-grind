# Environment Variables Configuration for Production

## Backend Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Node environment
NODE_ENV=production

# Server
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@db.example.com:5432/maindb
DATABASE_READ_URL=postgresql://user:password@db-read-replica.example.com:5432/maindb (optional)

# Redis (for rate limiting and caching)
REDIS_URL=redis://default:password@redis.example.com:6379

# JWT Secrets (use strong random values)
JWT_ACCESS_SECRET=your_strong_random_secret_at_least_32_chars_long_here_1234567890
JWT_REFRESH_SECRET=your_other_strong_random_secret_at_least_32_chars_long_here_9876543210

# Token TTL
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# CORS Configuration (REQUIRED in production - cannot use localhost)
CORS_ORIGINS=https://app.example.com,https://www.example.com

# Trust proxy if behind load balancer
TRUST_PROXY=true

# Auth Cookie Configuration
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_DOMAIN=.example.com (optional, for subdomain sharing)

# Rate Limiting
API_GLOBAL_RATE_LIMIT_WINDOW_MS=60000
API_GLOBAL_RATE_LIMIT_MAX_REQUESTS=2000
API_AUTH_READ_RATE_LIMIT_WINDOW_MS=60000
API_AUTH_READ_RATE_LIMIT_MAX_REQUESTS=600

# Logging
LOG_LEVEL=info

# Error Tracking (Sentry)
SENTRY_DSN=https://your_key@sentry.io/your_project_id

# Media Storage
MEDIA_PROVIDER=local (or cloudinary)
MEDIA_PUBLIC_BASE_URL=https://cdn.example.com
MEDIA_CLOUDINARY_FOLDER=after-hours-grind
CLOUDINARY_CLOUD_NAME=your_cloudinary_name (optional)
CLOUDINARY_API_KEY=your_api_key (optional)
CLOUDINARY_API_SECRET=your_api_secret (optional)

# Third-party Integrations
DEFAULT_TRAINER_WHATSAPP_NUMBER=+1234567890 (optional)
STRAVA_CLIENT_ID=your_strava_client_id (optional)
STRAVA_CLIENT_SECRET=your_strava_client_secret (optional)
STRAVA_REDIRECT_URI=https://api.example.com/api/auth/strava/callback (optional)

# Seed Configuration (only used during development, locked in production)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=YourStrongPassword123!
SEED_USER_PASSWORD=UserPassword456!
SEED_LOAD_STUDENT_COUNT=50
```

## Frontend Environment Variables

Create `.env.production` file in root directory:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.example.com/api

# Error Tracking (Sentry)
VITE_SENTRY_DSN=https://your_frontend_key@sentry.io/your_frontend_project_id
```

## Railway Deployment

This repository is intended to run as two Railway services in the same Railway project:

1. Frontend service at the repo root.
2. Backend service with root directory set to `backend/`.

Frontend service settings:

1. Build command: `npm run build`
2. Start command: `npm start`
3. Public root: `dist`
4. Set `VITE_API_BASE_URL` to the backend Railway URL plus `/api`, for example `https://your-backend.up.railway.app/api`.

Backend service settings:

1. Build command: `npm run build`
2. Start command: `npm start`
3. Set `NODE_ENV=production`
4. Set `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, and cookie settings for your frontend domain.

Do not point the frontend directly at localhost in production. The frontend must call the backend Railway URL.

## Important Security Notes

1. **NEVER commit .env files** - they contain secrets
2. **Generate JWT secrets** with: `openssl rand -base64 32`
3. **CORS_ORIGINS must be production domain** - will error if pointing to localhost in production
4. **AUTH_COOKIE_SECURE** must be true in production (HTTPS only)
5. **DATABASE_URL** should be from managed service (Neon, AWS RDS, etc.)
6. **REDIS_URL** should be from managed service (Upstash, Redis Cloud, etc.)
7. **Seed will be BLOCKED in production** - no database pollution possible

## Deployment Checklist

- [ ] All required env variables set
- [ ] Secrets are strong (32+ chars, mixed case, numbers, symbols)
- [ ] NODE_ENV=production in backend
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS_ORIGINS updated to production domain
- [ ] Database migrations applied: `npm run prisma:migrate:deploy`
- [ ] Sentry DSN configured for monitoring
- [ ] Redis connection verified
- [ ] Database connection pooling configured (PgBouncer recommended)
- [ ] Seed script will be blocked from running
- [ ] Load test passed with 50+ concurrent users
