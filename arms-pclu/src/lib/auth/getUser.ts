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
 * Redirects if the current user is not an ADMIN (New Admin Portal).
 * Use at the top of admin-only Server Actions.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "ADMIN") {
    if (user.role === "DEAN") redirect("/dean/dashboard")
    redirect("/faculty/dashboard")
  }
  return user
}

/**
 * Redirects if the current user is not a DEAN (Dean's Portal).
 */
export async function requireDean(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "DEAN") {
    if (user.role === "ADMIN") redirect("/admin/dashboard")
    redirect("/faculty/dashboard")
  }
  return user
}

/**
 * Allows both ADMIN and DEAN roles for shared functionality.
 */
export async function requireAdminOrDean(): Promise<User> {
  const user = await requireUser()
  if (user.role !== "ADMIN" && user.role !== "DEAN") {
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
    if (user.role === "DEAN") redirect("/dean/dashboard")
    redirect("/admin/dashboard")
  }
  return user
}

// ─── Server Action-safe variants ────────────────────────────────────────────

export async function requireUserOrThrow(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: No active session. Please log in again.")
  }
  return user
}

export async function requireAdminOrThrow(): Promise<User> {
  const user = await requireUserOrThrow()
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: ADMIN role required.")
  }
  return user
}

export async function requireAdminOrDeanOrThrow(): Promise<User> {
  const user = await requireUserOrThrow()
  if (user.role !== "ADMIN" && user.role !== "DEAN") {
    throw new Error("Forbidden: ADMIN or DEAN role required.")
  }
  return user
}

