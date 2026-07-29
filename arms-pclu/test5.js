
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEAN'] }, isActive: true },
    select: { id: true, role: true },
  });
  console.log('Reviewers:', reviewers);

  if (reviewers.length > 0) {
    console.log('Creating notifications...');
    const result = await prisma.notification.createMany({
      data: reviewers.map((r) => ({
        userId: r.id,
        message: 'Test notification',
        type: 'SUBMISSION',
        link: r.role === 'ADMIN' ? '/admin/submissions' : '/dean/submissions',
      })),
    });
    console.log('Create result:', result);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());

