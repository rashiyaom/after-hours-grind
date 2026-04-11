-- Achievement definitions & user earned achievements
CREATE TABLE "AchievementDef" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '🏆',
    "category" TEXT NOT NULL DEFAULT 'general',
    "threshold" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AchievementDef_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AchievementDef_key_key" ON "AchievementDef"("key");

CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "AchievementDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Progress entries for tracking metrics over time
CREATE TABLE "ProgressEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION,
    "bodyFatPct" DOUBLE PRECISION,
    "stepCount" INTEGER,
    "workoutMinutes" INTEGER,
    "caloriesBurned" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "waterLiters" DOUBLE PRECISION,
    "mood" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProgressEntry_userId_date_key" ON "ProgressEntry"("userId", "date");
CREATE INDEX "ProgressEntry_userId_idx" ON "ProgressEntry"("userId");
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User settings for notification prefs, privacy, etc.
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "showStreak" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default achievements
INSERT INTO "AchievementDef" ("id", "key", "name", "description", "icon", "category", "threshold", "points") VALUES
('ach_first_login', 'first_login', 'First Steps', 'Logged in for the first time', '👣', 'general', 1, 10),
('ach_streak_3', 'streak_3', 'On Fire', '3-day workout streak', '🔥', 'streak', 3, 25),
('ach_streak_7', 'streak_7', 'Week Warrior', '7-day workout streak', '⚡', 'streak', 7, 50),
('ach_streak_30', 'streak_30', 'Iron Will', '30-day workout streak', '🏆', 'streak', 30, 200),
('ach_first_upload', 'first_upload', 'Show & Tell', 'First task submission uploaded', '📸', 'social', 1, 15),
('ach_10_tasks', 'tasks_10', 'Grinder', 'Completed 10 tasks', '💪', 'progress', 10, 50),
('ach_50_tasks', 'tasks_50', 'Beast Mode', 'Completed 50 tasks', '🦁', 'progress', 50, 150),
('ach_first_post', 'first_post', 'Content Creator', 'Published first feed post', '✍️', 'social', 1, 15),
('ach_10_likes', 'likes_10', 'Popular', 'Received 10 likes on posts', '❤️', 'social', 10, 30),
('ach_plan_complete', 'plan_complete', 'Mission Complete', 'Completed a full training plan', '🎯', 'progress', 1, 100);
