import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { User } from "@prisma/client"

/**
 * Reads the current Supabase session and returns the
 * matching Prisma User record, or null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
    })

    return dbUser
  } catch {
    return null
  }
}

/**
 * Like getCurrentUser, but redirects to /login if not authenticated.
 * Use in Server Components and Server Actions that require a session.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

/**
 * Redirects to /login (or /faculty/dashboard if wrong role) if the
 * current user is not an ADMIN. Use at the top of admin-only Server Actions.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "ADMIN") {
    redirect("/faculty/dashboard")
  }
  return user
}

/**
 * Redirects to /admin/dashboard if the user is not a FACULTY member.
 */
export async function requireFaculty(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "FACULTY") {
    redirect("/admin/dashboard")
  }
  return user
}
