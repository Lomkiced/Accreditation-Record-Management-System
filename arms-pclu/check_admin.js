const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@pclu.edu.ph' } });
  console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
