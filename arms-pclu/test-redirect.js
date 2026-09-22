require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

async function testRedirect() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: "janellamaeducusin@gmail.com",
    options: {
      redirectTo: "http://localhost:3000/update-password",
    },
  });
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Action Link:", data.properties.action_link);
  
  // Try fetching the action link without following redirects to see the Location header
  const res = await fetch(data.properties.action_link, { redirect: "manual" });
  console.log("Redirect Status:", res.status);
  console.log("Redirect Location:", res.headers.get("location"));
}

testRedirect();
