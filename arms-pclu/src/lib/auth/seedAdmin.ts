import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

const ADMIN_EMAIL = "admin@pclu.edu.ph"
const ADMIN_PASSWORD = "ARMS@Admin2025!"
const ADMIN_NAME = "System Administrator"

/**
 * One-time script to seed the initial ADMIN account.
 *
 * USAGE:
 *   1. Visit http://localhost:3000/api/seed (GET) in your browser.
 *   2. Confirm the response shows success.
 *   3. IMMEDIATELY delete src/app/api/seed/route.ts.
 *   4. Log in with the credentials below and change the password.
 *
 * Credentials:
 *   Email:    admin@pclu.edu.ph
 *   Password: ARMS@Admin2025!
 */
export async function seedAdminAccount(): Promise<{
  success: boolean
  message: string
}> {
  // Verify env vars are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return {
      success: false,
      message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.",
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check if admin already exists in Prisma
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existing) {
    return {
      success: true,
      message: `Admin account already exists (id: ${existing.id}). No changes made.`,
    }
  }

  // Create Supabase Auth user via admin client
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_NAME,
        role: "ADMIN",
      },
    })

  if (authError || !authData.user) {
    return {
      success: false,
      message: `Supabase auth error: ${authError?.message ?? "Unknown error"}`,
    }
  }

  // Create Prisma user record linked by authId
  const newUser = await prisma.user.create({
    data: {
      authId: authData.user.id,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: "ADMIN",
      department: "Administration",
      designation: "System Administrator",
      isActive: true,
    },
  })

  return {
    success: true,
    message: `✅ Admin account created. ID: ${newUser.id}. Login with ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}. Change password after first login!`,
  }
}
