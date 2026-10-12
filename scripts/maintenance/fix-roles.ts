import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: ['pradipta@gmail.com', 'sohanggmail.com']
      }
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
