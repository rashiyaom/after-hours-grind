# THE afterhour socials — Backend

## Quick Start (Windows / PowerShell)

```powershell
cd backend
npm install
npx prisma generate

# Copy .env.example to .env and fill in your Neon DATABASE_URL + secrets
Copy-Item .env.example .env

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start dev server
npm run dev
```

Server runs at `http://localhost:4000`.
Health check: `GET http://localhost:4000/api/health`

## Secure Admin Seed Credentials

The seed script does not use a hardcoded admin password.

Set these in `.env` before running `npx prisma db seed`:

- `SEED_ADMIN_EMAIL` (optional, defaults to `admin@ahg.com`)
- `SEED_ADMIN_PASSWORD` (required, strong password: 12+ chars with upper/lowercase, number, symbol)

## Production Build

```powershell
npm run prisma:migrate:deploy
npm run build
$env:NODE_ENV="production"; npm start
```

## API Base

All endpoints under `/api`. See `src/routes/index.ts` for full route map.

## Media Uploads (DB URL-only)

Use `POST /api/uploads/media` (multipart form field: `file`) to upload image/video and get back a URL.

- Default provider: `MEDIA_PROVIDER=local`
- Local files are stored in `backend/uploads` and served from `/media/*`
- Optional provider: `MEDIA_PROVIDER=cloudinary`

Required env keys for Cloudinary mode:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

All post/submission media should use the returned URL instead of storing Base64 in the database.
