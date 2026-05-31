-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "achievementId" TEXT,
    "submissionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardTransaction_userId_createdAt_idx" ON "RewardTransaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RewardTransaction_kind_idx" ON "RewardTransaction"("kind");

-- CreateIndex
CREATE INDEX "RewardTransaction_achievementId_idx" ON "RewardTransaction"("achievementId");

-- CreateIndex
CREATE INDEX "RewardTransaction_submissionId_idx" ON "RewardTransaction"("submissionId");

-- AddForeignKey
ALTER TABLE "RewardTransaction"
ADD CONSTRAINT "RewardTransaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction"
ADD CONSTRAINT "RewardTransaction_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
