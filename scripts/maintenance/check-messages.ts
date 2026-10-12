import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({
    where: {
      imageUrl: {
        not: null
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  });
  console.log(JSON.stringify(messages, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
