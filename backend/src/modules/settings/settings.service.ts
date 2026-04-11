import { prisma } from "../../config/prisma.js";

export type SettingsInput = {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  profileVisibility?: string;
  showStreak?: boolean;
  showLeaderboard?: boolean;
  theme?: string;
};

export async function getSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  return settings;
}

export async function updateSettings(userId: string, input: SettingsInput) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
