
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const deans = await prisma.user.findMany({ where: { role: 'DEAN' } });
  console.log('Deans:', deans.map(d => ({ id: d.id, email: d.email, role: d.role, isActive: d.isActive })));
  
  if (deans.length > 0) {
    const notifs = await prisma.notification.findMany({ where: { userId: deans[0].id } });
    console.log('Dean Notifications:', notifs);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());

