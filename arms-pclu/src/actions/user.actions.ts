"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminOrDean, requireAdminOrDeanOrThrow } from "@/lib/auth/getUser"
import { Role } from "@prisma/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export type UserWithCounts = {
  id: string
  name: string
  email: string
  role: Role
  department: string
  designation: string
  status: "ACTIVE" | "INACTIVE"
  assignedAreas: number
  lastLogin: string | null
}

export async function getUsers(roles: Role[] = ["FACULTY"]): Promise<UserWithCounts[]> {
  await requireAdminOrDean()

  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { name: "asc" },
  })
  
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    status: user.isActive ? "ACTIVE" : "INACTIVE",
    assignedAreas: user._count.assignments,
    lastLogin: null, // Tracked in Supabase Auth, not DB
  }))
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminOrDeanOrThrow()
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!targetUser) {
      return { success: false, error: "User not found in database." }
    }
    
    // Deans can only delete Faculty
    if (admin.role === "DEAN" && targetUser.role !== "FACULTY") {
      return { success: false, error: "Insufficient permissions to delete this account type." }
    }
    // Do not allow admin to delete themselves
    if (targetUser.id === admin.id) {
      return { success: false, error: "You cannot delete your own account." }
    }

    // 1. Delete from Supabase Auth
    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (envErr) {
      return { success: false, error: "Server configuration error." }
    }
    
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(targetUser.authId)
    if (authError) {
      console.error("[deleteUserAccount] Supabase delete error:", authError.message)
      return { success: false, error: "Failed to delete user from authentication provider." }
    }

    // 2. Delete from Prisma
    await prisma.user.delete({ where: { id: userId } })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_USER_ACCOUNT",
        module: "USER",
        details: { targetEmail: targetUser.email, targetRole: targetUser.role },
      },
    })
    
    revalidatePath("/admin/users")
    return { success: true }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_NOT_FOUND")) {
      throw err
    }
    return { success: false, error: err.message || "Failed to delete user." }
  }
}
