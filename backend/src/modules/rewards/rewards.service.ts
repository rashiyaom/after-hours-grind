import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export type RewardKind =
  | "admin_adjustment"
  | "achievement_auto"
  | "achievement_manual"
  | "submission_approval"
  | "milestone_override";

export type RewardTransactionInput = {
  userId: string;
  delta: number;
  kind: RewardKind;
  reason: string;
  createdById?: string;
  achievementId?: string | null;
  submissionId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordRewardTransaction(input: RewardTransactionInput) {
  return prisma.rewardTransaction.create({
    data: {
      userId: input.userId,
      delta: input.delta,
      kind: input.kind,
      reason: input.reason,
      createdById: input.createdById,
      achievementId: input.achievementId ?? null,
      submissionId: input.submissionId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function getRecentRewardTransactions(userId: string, take = 6) {
  return prisma.rewardTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
