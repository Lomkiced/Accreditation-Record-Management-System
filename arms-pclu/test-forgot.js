require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createClient } = require("@supabase/supabase-js");

async function testForgotPassword() {
  const email = "janellamaeducusin@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
  });
  console.log("User in Prisma:", user);

  if (!user) {
    console.log("No user found in prisma. Fetching any user.");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Some user:", users[0]);
    if(users[0]) email = users[0].email;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: email || user?.email,
    options: {
      redirectTo: "http://localhost:3000/api/auth/callback?next=/update-password",
    },
  });

  console.log("generateLink Data:", data);
  console.log("generateLink Error:", error);
}

testForgotPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
