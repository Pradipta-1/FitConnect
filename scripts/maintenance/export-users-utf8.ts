import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  const output = JSON.stringify(users, null, 2);
  fs.writeFileSync('users_utf8.json', output, 'utf8');
  console.log(`Wrote ${users.length} users to users_utf8.json`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
