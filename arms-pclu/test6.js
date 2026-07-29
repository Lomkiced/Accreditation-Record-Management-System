
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const logs = await prisma.auditLog.findMany({ 
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });
  console.log('Recent Logs:', JSON.stringify(logs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());

