const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, serviceKey);
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@pclu.edu.ph' } });
  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.authId, {
      password: 'ARMS@Admin2025!',
      email_confirm: true
    });
    console.log('Update Error:', error);
    console.log('Update Data:', data.user?.id);
  } else {
    console.log("User not found in Prisma.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
