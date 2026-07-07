"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireUser } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateFacultySchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from "@/lib/validations/auth.schema"
import { sanitizeString, sanitizeEmail, sanitizeName } from "@/lib/sanitize"

// ─── Shared result type ───────────────────────────────────────────────────────
type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

// ─── Helper: detect Next.js internal redirect/notFound errors ─────────────────
// Next.js `redirect()` and `notFound()` work by throwing special errors.
// If we catch them in a Server Action we MUST re-throw, otherwise the
// redirect is silently swallowed and the user sees a generic error instead.
function isNextRedirectError(error: unknown): boolean {
  if (error instanceof Error) {
    // Next.js 14 uses error.digest starting with "NEXT_REDIRECT" or "NEXT_NOT_FOUND"
    const digest = (error as Error & { digest?: string }).digest
    if (typeof digest === "string") {
      return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
    }
  }
  return false
}

// ─── CREATE FACULTY ACCOUNT (Admin only) ──────────────────────────────────────
export async function createFacultyAccount(
  formData: z.infer<typeof CreateFacultySchema>
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  // Track Supabase auth user id for rollback on Prisma failure
  let createdAuthUserId: string | null = null

  try {
    // 1. Verify admin (may throw NEXT_REDIRECT if unauthenticated)
    const admin = await requireAdmin()

    // 2. Validate + sanitize input
    const validated = CreateFacultySchema.parse({
      ...formData,
      name: sanitizeName(formData.name),
      email: sanitizeEmail(formData.email),
      department: sanitizeString(formData.department),
      designation: sanitizeString(formData.designation),
    })

    // 3. Check for duplicate email in Prisma
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    if (existing) {
      return { error: "A user with this email already exists." }
    }

    // 4. Create Supabase Auth user (admin client skips email confirmation)
    const adminSupabase = createAdminClient()
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email: validated.email,
        password: validated.password,
        email_confirm: true,
        user_metadata: {
          name: validated.name,
          role: "FACULTY",
        },
      })

    if (authError || !authData.user) {
      console.error("[createFacultyAccount] Supabase Auth error:", authError?.message)
      return {
        error: authError?.message ?? "Failed to create authentication account.",
      }
    }

    createdAuthUserId = authData.user.id

    // 5. Create Prisma record linked by authId
    const newUser = await prisma.user.create({
      data: {
        authId: authData.user.id,
        name: validated.name,
        email: validated.email,
        role: "FACULTY",
        department: validated.department,
        designation: validated.designation,
        phone: validated.phone ? sanitizeString(validated.phone) : null,
        isActive: true,
      },
    })

    // If we reach here, both Supabase + Prisma succeeded — clear rollback flag
    createdAuthUserId = null

    // 6. Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_FACULTY_ACCOUNT",
        module: "USER",
        targetId: newUser.id,
        details: {
          name: newUser.name,
          email: newUser.email,
          department: newUser.department,
        },
      },
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      data: { id: newUser.id, name: newUser.name, email: newUser.email },
    }
  } catch (error) {
    // ── CRITICAL: re-throw Next.js redirect/notFound errors ──
    if (isNextRedirectError(error)) {
      throw error
    }

    // ── Rollback: delete orphaned Supabase Auth user if Prisma failed ──
    if (createdAuthUserId) {
      try {
        const adminSupabase = createAdminClient()
        await adminSupabase.auth.admin.deleteUser(createdAuthUserId)
        console.warn(
          `[createFacultyAccount] Rolled back Supabase Auth user ${createdAuthUserId} after Prisma failure.`
        )
      } catch (rollbackErr) {
        console.error(
          "[createFacultyAccount] CRITICAL: Failed to rollback Supabase Auth user:",
          createdAuthUserId,
          rollbackErr
        )
      }
    }

    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }

    // ── Structured production logging ──
    console.error("[createFacultyAccount] Unhandled error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { error: "Failed to create account. Please try again." }
  }
}

// ─── TOGGLE FACULTY ACTIVE STATUS (Admin only) ────────────────────────────────
export async function toggleFacultyStatus(
  userId: string,
  activate: boolean
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!targetUser) return { error: "User not found." }

    // Update Supabase ban status
    const adminSupabase = createAdminClient()
    const { error: banError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      {
        ban_duration: activate ? "none" : "876600h", // 100 years ≈ permanent ban
      }
    )
    if (banError) {
      console.error("[toggleFacultyStatus] Supabase ban error:", banError.message)
      return { error: "Failed to update authentication status." }
    }

    // Update Prisma record
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: activate },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: activate ? "ACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
        module: "USER",
        targetId: userId,
        details: {
          targetName: targetUser.name,
          targetEmail: targetUser.email,
        },
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }
    console.error("[toggleFacultyStatus] Unhandled error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })
    return { error: "Failed to update account status." }
  }
}

// ─── UPDATE OWN PROFILE ───────────────────────────────────────────────────────
export async function updateProfile(
  formData: z.infer<typeof UpdateProfileSchema>
): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const validated = UpdateProfileSchema.parse({
      name: sanitizeName(formData.name),
      department: sanitizeString(formData.department),
      designation: sanitizeString(formData.designation),
      phone: formData.phone ? sanitizeString(formData.phone) : undefined,
    })

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: validated.name,
        department: validated.department,
        designation: validated.designation,
        phone: validated.phone ?? null,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "UPDATE_PROFILE",
        module: "USER",
        details: { updatedFields: ["name", "department", "designation", "phone"] },
      },
    })

    revalidatePath("/admin/profile")
    revalidatePath("/faculty/profile")
    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    console.error("[updateProfile] Unhandled error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })
    return { error: "Failed to update profile." }
  }
}

// ─── CHANGE OWN PASSWORD ──────────────────────────────────────────────────────
export async function changePassword(
  formData: z.infer<typeof ChangePasswordSchema>
): Promise<ActionResult> {
  try {
    const validated = ChangePasswordSchema.parse(formData)

    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser?.email) return { error: "Unauthorized." }

    // Re-authenticate with current password first (prevents stolen-cookie attacks)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: validated.currentPassword,
    })

    if (signInError) {
      return { error: "Current password is incorrect." }
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validated.newPassword,
    })

    if (updateError) {
      return { error: "Failed to update password. Please try again." }
    }

    // Audit log
    const dbUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
    })
    if (dbUser) {
      await prisma.auditLog.create({
        data: {
          userId: dbUser.id,
          action: "CHANGE_PASSWORD",
          module: "AUTH",
          details: { timestamp: new Date().toISOString() },
        },
      })
    }

    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    console.error("[changePassword] Unhandled error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })
    return { error: "Failed to change password." }
  }
}

// ─── RESET FACULTY PASSWORD (Admin only) ──────────────────────────────────────
export async function resetFacultyPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters." }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!targetUser) return { error: "User not found." }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      { password: newPassword }
    )

    if (error) {
      console.error("[resetFacultyPassword] Supabase error:", error.message)
      return { error: "Failed to reset password." }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "RESET_PASSWORD",
        module: "AUTH",
        targetId: userId,
        details: { targetName: targetUser.name, targetEmail: targetUser.email },
      },
    })

    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }
    console.error("[resetFacultyPassword] Unhandled error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })
    return { error: "Failed to reset password." }
  }
}

// ─── UPDATE FACULTY PROFILE (Admin only) ──────────────────────────────────────
export async function updateFacultyProfile(
  userId: string,
  formData: z.infer<typeof UpdateProfileSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const validated = UpdateProfileSchema.parse({
      name: sanitizeName(formData.name),
      department: sanitizeString(formData.department),
      designation: sanitizeString(formData.designation),
      phone: formData.phone ? sanitizeString(formData.phone) : undefined,
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.name,
        department: validated.department,
        designation: validated.designation,
        phone: validated.phone ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_FACULTY_PROFILE",
        module: "USER",
        targetId: userId,
        details: validated,
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    console.error("[updateFacultyProfile] Unhandled error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })
    return { error: "Failed to update faculty profile." }
  }
}
