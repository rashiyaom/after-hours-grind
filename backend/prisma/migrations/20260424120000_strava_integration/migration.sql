ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "externalId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Post_source_externalId_key"
ON "Post"("source", "externalId");

CREATE TABLE IF NOT EXISTS "StravaConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "athleteId" BIGINT NOT NULL,
  "athleteUsername" TEXT,
  "athleteFirstName" TEXT,
  "athleteLastName" TEXT,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'read',
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StravaConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StravaConnection_userId_key"
ON "StravaConnection"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "StravaConnection_athleteId_key"
ON "StravaConnection"("athleteId");

CREATE INDEX IF NOT EXISTS "StravaConnection_userId_lastSyncAt_idx"
ON "StravaConnection"("userId", "lastSyncAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'StravaConnection_userId_fkey'
  ) THEN
    ALTER TABLE "StravaConnection"
    ADD CONSTRAINT "StravaConnection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
