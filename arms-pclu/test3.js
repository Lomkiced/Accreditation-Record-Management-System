
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const notifs = await prisma.notification.findMany({
    where: { type: 'SUBMISSION' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Submission Notifications:', notifs);
}

check().catch(console.error).finally(() => prisma.$disconnect());

