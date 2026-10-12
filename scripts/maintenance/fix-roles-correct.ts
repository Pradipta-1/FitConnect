import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      email: 'sohanganguly141@gmail.com'
    },
    data: {
      role: 'TRAINER'
    }
  });
  console.log(`Updated ${result.count} users to TRAINER role.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
