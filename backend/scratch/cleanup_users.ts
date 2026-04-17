import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Identify critical users to keep
  const keepUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'vinit', mode: 'insensitive' } },
        { name: { contains: 'arjun', mode: 'insensitive' } },
        { role: 'ADMIN' },
        { email: { contains: 'admin', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, email: true }
  });

  const keepIds = keepUsers.map(u => u.id);
  
  console.log('Keeping users:', keepUsers.map(u => `${u.name} (${u.email})`).join(', '));

  // 2. Delete all other users
  // Note: We use deleteMany which will trigger cascade if defined in schema, 
  // but Prisma handles relations carefully.
  const result = await prisma.user.deleteMany({
    where: {
      id: { notIn: keepIds }
    }
  });

  console.log(`Deleted ${result.count} test users.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
