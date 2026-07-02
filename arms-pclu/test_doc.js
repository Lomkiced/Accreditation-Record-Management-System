const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.document.findFirst({
    where: { title: 'kkm' },
    include: { versions: true }
  });
  console.log(doc);
}
main().catch(console.error).finally(() => prisma.$disconnect());
