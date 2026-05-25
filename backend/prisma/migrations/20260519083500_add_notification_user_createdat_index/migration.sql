-- Speeds up notifications query: WHERE userId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
ON "Notification"("userId", "createdAt" DESC);
