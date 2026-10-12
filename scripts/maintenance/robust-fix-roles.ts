import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const name = user.name.toLowerCase();
    if (name.includes('sohang')) {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'TRAINER' } });
      console.log(`Set ${user.email} (Sohang) to TRAINER`);
    } else if (name.includes('pradipta')) {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'USER' } });
      console.log(`Set ${user.email} (Pradipta) to USER`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
