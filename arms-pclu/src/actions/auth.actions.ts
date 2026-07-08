"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma"
import { requireAdminOrThrow, requireUser } from "@/lib/auth/getUser"
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
function isNextRedirectError(error: unknown): boolean {
  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest
    if (typeof digest === "string") {
      return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
    }
  }
  return false
}

// ─── Helper: generate short correlation ID for log tracing ────────────────────
function correlationId(): string {
  return `cfa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── CREATE FACULTY ACCOUNT (Admin only) ──────────────────────────────────────
export async function createFacultyAccount(
  formData: z.infer<typeof CreateFacultySchema>
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  const cid = correlationId()
  let createdAuthUserId: string | null = null

  try {
    const admin = await requireAdminOrThrow()

    const validated = CreateFacultySchema.parse({
      ...formData,
      name: sanitizeName(formData.name),
      email: sanitizeEmail(formData.email),
      department: sanitizeString(formData.department),
      designation: sanitizeString(formData.designation),
    })

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    if (existing) {
      return { error: "A user with this email already exists." }
    }

    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (envErr) {
      console.error(`[${cid}] createAdminClient failed:`, envErr)
      return {
        error:
          "Server configuration error: Unable to initialize admin client. " +
          "Please contact your system administrator.",
      }
    }

    let authUserId: string

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
      if (
        authError?.message?.toLowerCase().includes("already been registered") ||
        authError?.message?.toLowerCase().includes("already exists")
      ) {
        console.warn(
          `[${cid}] Supabase Auth user exists for ${validated.email} but no Prisma record. Attempting orphan recovery...`
        )
        const { data: listData } = await adminSupabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        })
        const orphan = listData?.users?.find(
          (u) => u.email?.toLowerCase() === validated.email.toLowerCase()
        )

        if (orphan) {
          await adminSupabase.auth.admin.deleteUser(orphan.id)
          console.warn(
            `[${cid}] Deleted orphaned auth user ${orphan.id} for ${validated.email}. Retrying creation...`
          )

          const { data: retryData, error: retryError } =
            await adminSupabase.auth.admin.createUser({
              email: validated.email,
              password: validated.password,
              email_confirm: true,
              user_metadata: {
                name: validated.name,
                role: "FACULTY",
              },
            })

          if (retryError || !retryData.user) {
            console.error(`[${cid}] Retry also failed:`, retryError?.message)
            return {
              error: retryError?.message ?? "Failed to create authentication account after orphan recovery.",
            }
          }

          authUserId = retryData.user.id
        } else {
          console.error(`[${cid}] Could not find orphan for ${validated.email}`)
          return {
            error: authError?.message ?? "Failed to create authentication account.",
          }
        }
      } else {
        console.error(`[${cid}] Supabase Auth error:`, {
          message: authError?.message,
          status: authError?.status,
        })
        return {
          error: authError?.message ?? "Failed to create authentication account.",
        }
      }
    } else {
      authUserId = authData.user.id
    }

    createdAuthUserId = authUserId

    const newUser = await prisma.user.create({
      data: {
        authId: authUserId,
        name: validated.name,
        email: validated.email,
        role: "FACULTY",
        department: validated.department,
        designation: validated.designation,
        phone: validated.phone ? sanitizeString(validated.phone) : null,
        isActive: true,
      },
    })

    createdAuthUserId = null

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
          correlationId: cid,
        },
      },
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      data: { id: newUser.id, name: newUser.name, email: newUser.email },
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }

    if (createdAuthUserId) {
      try {
        const adminSupabase = createAdminClient()
        await adminSupabase.auth.admin.deleteUser(createdAuthUserId)
        console.warn(
          `[${cid}] Rolled back Supabase Auth user ${createdAuthUserId} after Prisma failure.`
        )
      } catch (rollbackErr) {
        console.error(
          `[${cid}] CRITICAL: Failed to rollback Supabase Auth user:`,
          createdAuthUserId,
          rollbackErr
        )
      }
    }

    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }

    if (error instanceof Error) {
      if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
        return { error: error.message }
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${cid}] Unhandled error in createFacultyAccount:`, {
      name: error instanceof Error ? error.name : "Unknown",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })

    return {
      error: `Failed to create account: ${errorMessage}`,
    }
  }
}

// ─── TOGGLE FACULTY ACTIVE STATUS (Admin only) ────────────────────────────────
export async function toggleFacultyStatus(
  userId: string,
  activate: boolean
): Promise<ActionResult> {
  const cid = correlationId()

  try {
    const admin = await requireAdminOrThrow()

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!targetUser) return { error: "User not found." }

    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (envErr) {
      console.error(`[${cid}] createAdminClient failed:`, envErr)
      return { error: "Server configuration error. Please contact your administrator." }
    }

    const { error: banError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      {
        ban_duration: activate ? "none" : "876600h",
      }
    )
    if (banError) {
      console.error(`[${cid}] Supabase ban error:`, banError.message)
      return { error: "Failed to update authentication status." }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: activate },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: activate ? "ACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
        module: "USER",
        targetId: userId,
        details: {
          targetName: targetUser.name,
          targetEmail: targetUser.email,
          correlationId: cid,
        },
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof Error) {
      if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
        return { error: error.message }
      }
    }

    console.error(`[${cid}] Unhandled error in toggleFacultyStatus:`, {
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: validated.currentPassword,
    })

    if (signInError) {
      return { error: "Current password is incorrect." }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: validated.newPassword,
    })

    if (updateError) {
      return { error: "Failed to update password. Please try again." }
    }

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
  const cid = correlationId()

  try {
    const admin = await requireAdminOrThrow()

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters." }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!targetUser) return { error: "User not found." }

    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (envErr) {
      console.error(`[${cid}] createAdminClient failed:`, envErr)
      return { error: "Server configuration error. Please contact your administrator." }
    }

    const { error } = await adminSupabase.auth.admin.updateUserById(
      targetUser.authId,
      { password: newPassword }
    )

    if (error) {
      console.error(`[${cid}] Supabase password reset error:`, error.message)
      return { error: "Failed to reset password." }
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "RESET_PASSWORD",
        module: "AUTH",
        targetId: userId,
        details: {
          targetName: targetUser.name,
          targetEmail: targetUser.email,
          correlationId: cid,
        },
      },
    })

    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (error instanceof Error) {
      if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
        return { error: error.message }
      }
    }

    console.error(`[${cid}] Unhandled error in resetFacultyPassword:`, {
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
  const cid = correlationId()

  try {
    const admin = await requireAdminOrThrow()

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
