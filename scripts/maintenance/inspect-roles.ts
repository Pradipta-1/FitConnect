import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      id: true
    }
  });
  console.log('Role counts:', JSON.stringify(roles, null, 2));

  const trainerUsers = await prisma.user.findMany({
    where: { role: 'TRAINER' },
    select: { email: true, name: true }
  });
  console.log('Trainer users:', JSON.stringify(trainerUsers, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
