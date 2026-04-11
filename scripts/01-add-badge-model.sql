-- Add Badge table
CREATE TABLE IF NOT EXISTS "Badge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "icon" TEXT NOT NULL,
  "earnedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Badge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE
);

-- Add unique constraint
CREATE UNIQUE INDEX "Badge_studentId_badgeId_key" ON "Badge"("studentId", "badgeId");

-- Add index on studentId
CREATE INDEX "Badge_studentId_idx" ON "Badge"("studentId");
