import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true }
  });
  console.log('---USERS-START---');
  users.forEach(u => console.log(`${u.email} | ${u.role} | ${u.name}`));
  console.log('---USERS-END---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
