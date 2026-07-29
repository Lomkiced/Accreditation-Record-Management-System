
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEAN'] }, isActive: true },
    select: { id: true, role: true },
  });
  console.log('Reviewers:', reviewers);
}

check().catch(console.error).finally(() => prisma.$disconnect());

