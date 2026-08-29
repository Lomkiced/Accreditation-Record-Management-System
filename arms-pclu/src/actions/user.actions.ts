"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminOrDean, requireAdminOrDeanOrThrow } from "@/lib/auth/getUser"
import { Role } from "@prisma/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath, revalidateTag } from "next/cache"

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

// ─── GET USERS (active only) ─────────────────────────────────────────────────

export async function getUsers(roles: Role[] = ["FACULTY"]): Promise<UserWithCounts[]> {
  await requireAdminOrDean()

  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      isActive: true,
    },
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

// ─── GET ARCHIVED USERS ──────────────────────────────────────────────────────

export async function getArchivedUsers(roles: Role[] = ["FACULTY"]): Promise<UserWithCounts[]> {
  await requireAdminOrDean()

  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      isActive: false,
    },
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
    status: "INACTIVE" as const,
    assignedAreas: user._count.assignments,
    lastLogin: null,
  }))
}

// ─── ARCHIVE USER ACCOUNT (Soft Delete) ──────────────────────────────────────

export async function archiveUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminOrDeanOrThrow()
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!targetUser) {
      return { success: false, error: "User not found in database." }
    }
    
    // Deans can only archive Faculty
    if (admin.role === "DEAN" && targetUser.role !== "FACULTY") {
      return { success: false, error: "Insufficient permissions to archive this account type." }
    }
    // Do not allow admin to archive themselves
    if (targetUser.id === admin.id) {
      return { success: false, error: "You cannot archive your own account." }
    }

    // 1. Disable the user in Supabase Auth (ban them so they can't log in)
    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (envErr) {
      return { success: false, error: "Server configuration error." }
    }
    
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      { ban_duration: "876000h" } // ~100 years ban = effectively disabled
    )
    if (authError) {
      console.warn("[archiveUserAccount] Supabase Auth ban error:", authError.message)
    }

    // 2. Set isActive = false in Prisma (soft-delete)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
    
    // 3. Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ARCHIVE_USER_ACCOUNT",
        module: "USER",
        targetId: userId,
        details: {
          targetName: targetUser.name,
          targetEmail: targetUser.email,
          targetRole: targetUser.role,
        },
      },
    })
    
    revalidatePath("/admin/users")
    revalidatePath("/dean/users")
    revalidateTag("dashboard")
    return { success: true }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_NOT_FOUND")) {
      throw err
    }
    return { success: false, error: err.message || "Failed to archive user." }
  }
}

// ─── RESTORE USER ACCOUNT ────────────────────────────────────────────────────

export async function restoreUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminOrDeanOrThrow()
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!targetUser) {
      return { success: false, error: "User not found in database." }
    }
    
    // Deans can only restore Faculty
    if (admin.role === "DEAN" && targetUser.role !== "FACULTY") {
      return { success: false, error: "Insufficient permissions to restore this account type." }
    }

    // 1. Re-enable the user in Supabase Auth (unban)
    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (envErr) {
      return { success: false, error: "Server configuration error." }
    }
    
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      { ban_duration: "none" }
    )
    if (authError) {
      console.warn("[restoreUserAccount] Supabase Auth unban error:", authError.message)
    }

    // 2. Set isActive = true in Prisma
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })
    
    // 3. Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "RESTORE_USER_ACCOUNT",
        module: "USER",
        targetId: userId,
        details: {
          targetName: targetUser.name,
          targetEmail: targetUser.email,
          targetRole: targetUser.role,
        },
      },
    })
    
    revalidatePath("/admin/users")
    revalidatePath("/dean/users")
    revalidateTag("dashboard")
    return { success: true }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_NOT_FOUND")) {
      throw err
    }
    return { success: false, error: err.message || "Failed to restore user." }
  }
}

// ─── PERMANENTLY DELETE USER ACCOUNT ─────────────────────────────────────────
// Only available from the archived users view for final cleanup.

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
      console.warn("[deleteUserAccount] Supabase Auth delete error (proceeding anyway):", authError.message)
    }

    // 2. Delete all documents from Supabase Storage
    try {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "documents"
      const { data: files } = await adminSupabase.storage.from(bucket).list(userId)
      if (files && files.length > 0) {
        const pathsToRemove = files.map(f => `${userId}/${f.name}`)
        const { error: storageError } = await adminSupabase.storage.from(bucket).remove(pathsToRemove)
        if (storageError) {
          console.error("[deleteUserAccount] Storage removal error:", storageError.message)
        }
      }
    } catch (storageErr) {
      console.error("[deleteUserAccount] Failed to clear user storage:", storageErr)
    }

    // 3. Delete from Prisma (Cascades to Document, DocumentMapping, DocumentVersion, etc.)
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
    revalidatePath("/dean/users")
    revalidateTag("dashboard")
    return { success: true }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_NOT_FOUND")) {
      throw err
    }
    return { success: false, error: err.message || "Failed to delete user." }
  }
}
