import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
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
 * Like getCurrentUser, but throws if not authenticated.
 * Use in Server Actions and API routes that require a session.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: No active session")
  }
  return user
}

/**
 * Throws if the current user is not an ADMIN.
 * Use at the top of all admin-only Server Actions.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required")
  }
  return user
}

/**
 * Throws if the current user is not a FACULTY member.
 */
export async function requireFaculty(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "FACULTY") {
    throw new Error("Forbidden: Faculty access required")
  }
  return user
}
