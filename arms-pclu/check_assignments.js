const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'FACULTY' },
    include: {
      assignments: {
        include: { area: true, criterion: true }
      }
    }
  });
  console.log('Faculty Users:');
  for (const user of users) {
    console.log(`- ${user.name} (${user.id}): ${user.assignments.length} assignments`);
    for (const a of user.assignments) {
      console.log(`  - Area: ${a.area.name} | Criterion: ${a.criterion?.name || 'ALL'}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
