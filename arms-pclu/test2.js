
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const logs = await prisma.auditLog.findMany({ 
    where: { action: { in: ['SUBMIT_DOCUMENT', 'RESUBMIT_DOCUMENT', 'SUBMIT_MAPPING', 'SUBMIT_ALL_MAPPINGS'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });
  console.log('Recent Logs:', JSON.stringify(logs, null, 2));

  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });
  console.log('Recent Notifications:', JSON.stringify(notifs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());

