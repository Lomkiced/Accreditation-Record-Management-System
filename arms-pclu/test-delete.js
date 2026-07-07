const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const area = await prisma.area.findFirst();
    if (!area) {
      console.log('No areas found');
      return;
    }
    console.log('Trying to delete area:', area.id);
    await prisma.area.delete({ where: { id: area.id } });
    console.log('Success');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
