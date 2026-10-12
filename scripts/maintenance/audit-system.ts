import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const selfMessages = await prisma.message.findMany({
    where: {
      senderId: { equals: prisma.message.fields.receiverId }
    }
  });
  console.log('--- SELF MESSAGES ---');
  console.log(JSON.stringify(selfMessages, null, 2));

  const allMessages = await prisma.message.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, senderId: true, receiverId: true, content: true }
  });
  console.log('--- LATEST MESSAGES ---');
  console.log(JSON.stringify(allMessages, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
