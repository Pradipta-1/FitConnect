import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: { contains: 'Sohan', mode: 'insensitive' }
    }
  });
  console.log(`Found ${users.length} users containing 'Sohan':`);
  users.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
