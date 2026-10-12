import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'pradipta@gmail.com' },
    data: { role: 'USER' }
  });
  console.log('Set pradipta@gmail.com to USER role for testing.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
