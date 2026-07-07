import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma"

/**
 * Production Diagnostics Endpoint
 * Tests each component of the user creation pipeline individually.
 * 
 * GET /api/diagnostics
 * 
 * DELETE THIS FILE after debugging is complete.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  }

  // ── Step 1: Check environment variables ──
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    // Show first/last 4 chars of service role key to verify it's the right one
    SERVICE_KEY_PREVIEW: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 8)}...${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-4)}`
      : "MISSING",
    SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING",
  }

  // ── Step 2: Test Supabase Admin Client ──
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      results.supabaseAdmin = { ok: false, error: error.message, status: error.status }
    } else {
      results.supabaseAdmin = {
        ok: true,
        totalUsers: data.users.length,
        message: "Service role key is valid and admin API is accessible.",
      }
    }
  } catch (err) {
    results.supabaseAdmin = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      type: err instanceof Error ? err.constructor.name : "Unknown",
    }
  }

  // ── Step 3: Test Prisma Database Connection ──
  try {
    const userCount = await prisma.user.count()
    results.prismaDB = {
      ok: true,
      userCount,
      message: "Database connection is healthy.",
    }
  } catch (err) {
    results.prismaDB = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      type: err instanceof Error ? err.constructor.name : "Unknown",
    }
  }

  // ── Step 4: Test Prisma can read admin user ──
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, authId: true },
    })
    results.adminUser = adminUser
      ? { ok: true, email: adminUser.email, hasAuthId: !!adminUser.authId }
      : { ok: false, error: "No ADMIN user found in database." }
  } catch (err) {
    results.adminUser = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  // ── Step 5: Check for orphaned Supabase auth users ──
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 })
    if (data?.users) {
      const authEmails = data.users.map((u) => u.email)
      const dbUsers = await prisma.user.findMany({
        where: { email: { in: authEmails.filter(Boolean) as string[] } },
        select: { email: true },
      })
      const dbEmails = new Set(dbUsers.map((u) => u.email))
      const orphaned = data.users
        .filter((u) => u.email && !dbEmails.has(u.email))
        .map((u) => ({ id: u.id, email: u.email, created: u.created_at }))

      results.orphanedAuthUsers = {
        count: orphaned.length,
        users: orphaned,
        message:
          orphaned.length > 0
            ? "These Supabase Auth users have no matching Prisma record. They may block new account creation with the same email."
            : "No orphaned auth users found.",
      }
    }
  } catch (err) {
    results.orphanedAuthUsers = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  // ── Step 6: Simulate the createUser flow (dry-run) ──
  try {
    const testEmail = `diag-test-${Date.now()}@test.invalid`
    const admin = createAdminClient()

    // Try creating a test user
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: testEmail,
        password: "DiagTest123!",
        email_confirm: true,
        user_metadata: { name: "Diagnostics Test", role: "FACULTY" },
      })

    if (authError) {
      results.createUserDryRun = {
        ok: false,
        step: "supabase_auth_create",
        error: authError.message,
        status: authError.status,
      }
    } else if (authData.user) {
      // Immediately clean up the test user
      await admin.auth.admin.deleteUser(authData.user.id)
      results.createUserDryRun = {
        ok: true,
        message: "Supabase Auth createUser works. Test user created and cleaned up.",
      }
    }
  } catch (err) {
    results.createUserDryRun = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      type: err instanceof Error ? err.constructor.name : "Unknown",
    }
  }

  return NextResponse.json(results, { status: 200 })
}
