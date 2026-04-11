-- Add chat message payload columns for reel-share and voice-note support
ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "voiceSeconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "voiceAudioUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "reelPostId" TEXT,
  ADD COLUMN IF NOT EXISTS "reelPreviewUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "reelCaption" TEXT;
