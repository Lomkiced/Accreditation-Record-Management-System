const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.assignment.findMany({}).then(res => { console.log('PRISMA SUCCESS', res.length); process.exit(0); }).catch(err => { console.error('PRISMA ERROR', err); process.exit(1); });
