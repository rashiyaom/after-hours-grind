-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "steps" INTEGER;

-- AlterTable
ALTER TABLE "StravaConnection" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "ChatThread_updatedAt_idx" ON "ChatThread"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date" ASC);

-- CreateIndex
CREATE INDEX "Plan_trainerId_createdAt_idx" ON "Plan"("trainerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Submission_studentId_planTaskId_createdAt_idx" ON "Submission"("studentId", "planTaskId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Submission_studentId_status_createdAt_idx" ON "Submission"("studentId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Submission_planTaskId_idx" ON "Submission"("planTaskId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt" DESC);
