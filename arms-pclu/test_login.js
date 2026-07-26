const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@pclu.edu.ph',
    password: 'ARMS@Admin2025!',
  });
  console.log('Error:', error);
  console.log('Data user:', data.user?.id);
}

main();
