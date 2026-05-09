"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
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

// ─── Supabase Admin Client (service role — server only) ───────────────────────
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// ─── Shared result type ───────────────────────────────────────────────────────
type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

// ─── CREATE FACULTY ACCOUNT (Admin only) ──────────────────────────────────────
export async function createFacultyAccount(
  formData: z.infer<typeof CreateFacultySchema>
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  try {
    // 1. Verify admin
    const admin = await requireAdmin()

    // 2. Validate + sanitize input
    const validated = CreateFacultySchema.parse({
      ...formData,
      name: sanitizeName(formData.name),
      email: sanitizeEmail(formData.email),
      department: sanitizeString(formData.department),
      designation: sanitizeString(formData.designation),
    })

    // 3. Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    if (existing) {
      return { error: "A user with this email already exists." }
    }

    // 4. Create Supabase Auth user (admin client skips email confirmation)
    const adminSupabase = getAdminClient()
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
      return {
        error: authError?.message ?? "Failed to create authentication account.",
      }
    }

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
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }
    console.error("[createFacultyAccount]", error)
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
    const adminSupabase = getAdminClient()
    const { error: banError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      {
        ban_duration: activate ? "none" : "876600h", // 100 years ≈ permanent ban
      }
    )
    if (banError) {
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
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }
    console.error("[toggleFacultyStatus]", error)
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
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    console.error("[updateProfile]", error)
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
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    console.error("[changePassword]", error)
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

    const adminSupabase = getAdminClient()
    const { error } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      { password: newPassword }
    )

    if (error) return { error: "Failed to reset password." }

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
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }
    console.error("[resetFacultyPassword]", error)
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
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    console.error("[updateFacultyProfile]", error)
    return { error: "Failed to update faculty profile." }
  }
}
