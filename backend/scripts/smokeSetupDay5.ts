import { prisma } from "../src/config/prisma.js";
import { createPersonalized25DayPlan } from "../src/modules/plans/personalizedPlan.js";

async function run() {
  const student = await prisma.user.findUnique({ where: { email: "student1@ahg.com" } });
  if (student == null) throw new Error("student missing");

  await createPersonalized25DayPlan(prisma, student.id);

  const profile = await prisma.studentProfile.findUnique({ where: { userId: student.id } });
  if (profile == null || profile.currentPlanId == null) throw new Error("plan missing");

  const day5 = await prisma.planDay.findUnique({
    where: { planId_day: { planId: profile.currentPlanId, day: 5 } },
    include: { tasks: true },
  });

  const titles = (day5?.tasks ?? []).map((task) => task.title);
  console.log("DAY5_TASK_TITLES=" + JSON.stringify(titles));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
