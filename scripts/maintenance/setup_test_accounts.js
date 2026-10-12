
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  // Clean up existing test accounts if any
  await prisma.user.deleteMany({
    where: { email: { in: ['user@test.com', 'trainer@test.com', 'trainer2@test.com'] } }
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      name: 'user',
      passwordHash: password,
      role: 'USER'
    }
  });

  const trainer = await prisma.user.create({
    data: {
      email: 'trainer@test.com',
      name: 'trainer',
      passwordHash: password,
      role: 'TRAINER'
    }
  });
  
  const trainer2 = await prisma.user.create({
    data: {
      email: 'trainer2@test.com',
      name: 'trainer2',
      passwordHash: password,
      role: 'TRAINER'
    }
  });

  console.log('Test accounts created:');
  console.log('User: user@test.com / password123');
  console.log('Trainer 1: trainer@test.com / password123');
  console.log('Trainer 2: trainer2@test.com / password123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
