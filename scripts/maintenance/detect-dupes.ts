import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  const nameGroups: Record<string, any[]> = {};
  users.forEach(u => {
    const name = u.name || 'No Name';
    if (!nameGroups[name]) nameGroups[name] = [];
    nameGroups[name].push(u);
  });

  console.log('--- DUPLICATE NAMES REPORT ---');
  for (const [name, group] of Object.entries(nameGroups)) {
    if (group.length > 1 || name.toLowerCase().includes('sohan')) {
      console.log(`Name: ${name}`);
      group.forEach(u => console.log(`  - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
