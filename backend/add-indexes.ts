import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding performance indexes...');
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ChatThread_updatedAt_idx" ON "ChatThread"("updatedAt" DESC);`);
  console.log('Created ChatThread_updatedAt_idx');
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Event_date_idx" ON "Event"("date" ASC);`);
  console.log('Created Event_date_idx');
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt" DESC);`);
  console.log('Created User_createdAt_idx');
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Plan_trainerId_createdAt_idx" ON "Plan"("trainerId", "createdAt" DESC);`);
  console.log('Created Plan_trainerId_createdAt_idx');
  
  console.log('All indexes added successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
