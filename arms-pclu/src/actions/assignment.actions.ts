"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin, requireUser } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { sanitizeString } from "@/lib/sanitize"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateAssignmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  areaId: z.string().uuid("Invalid area ID"),
  criterionId: z.string().uuid("Invalid criterion ID").optional(),
  notes: z.string().max(500).optional(),
})

// ─── GET ASSIGNMENTS FOR FACULTY ─────────────────────────────────────────────
// Faculty: sees only own. Admin: can see any userId.

export async function getAssignmentsForFaculty(userId: string) {
  try {
    const currentUser = await requireUser()

    // RBAC: faculty can only fetch their own assignments
    if (currentUser.role === "FACULTY" && currentUser.id !== userId) {
      return { error: "You can only view your own assignments." }
    }

    const assignments = await prisma.assignment.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        area: {
          select: { id: true, name: true, order: true },
        },
        criterion: {
          select: { id: true, name: true, order: true },
        },
      },
    })

    return { success: true as const, data: assignments }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getAssignmentsForFaculty]", error)
    return { error: "Failed to load assignments." }
  }
}

export type AssignmentWithRelations = NonNullable<
  Extract<
    Awaited<ReturnType<typeof getAssignmentsForFaculty>>,
    { success: true }
  >["data"]
>[number]

// ─── GET ASSIGNED AREA/CRITERION IDs (for faculty dashboard filtering) ────────
// Returns compact sets of areaIds and criterionIds the user is assigned to.

export async function getAssignedScopeForFaculty(userId?: string) {
  try {
    const currentUser = await requireUser()

    // Default to the current user if no userId provided (faculty self-fetch)
    const targetId = userId ?? currentUser.id

    // RBAC: faculty can only get own scope
    if (currentUser.role === "FACULTY" && currentUser.id !== targetId) {
      return { error: "Unauthorized." }
    }

    const assignments = await prisma.assignment.findMany({
      where: { userId: targetId },
      select: { areaId: true, criterionId: true },
    })

    const areaIds = [...new Set(assignments.map((a) => a.areaId))]
    const criterionIds = [
      ...new Set(
        assignments
          .map((a) => a.criterionId)
          .filter((id): id is string => id !== null)
      ),
    ]

    return { success: true as const, data: { areaIds, criterionIds } }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getAssignedScopeForFaculty]", error)
    return { error: "Failed to load assignment scope." }
  }
}

// ─── GET FACULTY WITH ASSIGNMENT COUNTS (for Admin's FacultyList) ────────────

export async function getFacultyWithAssignmentCounts() {
  try {
    await requireAdmin()

    const faculty = await prisma.user.findMany({
      where: { role: "FACULTY" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        designation: true,
        isActive: true,
        _count: {
          select: { assignments: true },
        },
      },
    })

    return {
      success: true as const,
      data: faculty.map((f) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        department: f.department,
        designation: f.designation,
        isActive: f.isActive,
        assignedCount: f._count.assignments,
      })),
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[getFacultyWithAssignmentCounts]", error)
    return { error: "Failed to load faculty list." }
  }
}

// ─── CREATE ASSIGNMENT (Admin only) ──────────────────────────────────────────

export async function createAssignment(
  formData: z.infer<typeof CreateAssignmentSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin()

    const validated = CreateAssignmentSchema.parse({
      userId: formData.userId,
      areaId: formData.areaId,
      criterionId: formData.criterionId,
      notes: formData.notes ? sanitizeString(formData.notes) : undefined,
    })

    // Verify the target user exists and is faculty
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
    })
    if (!targetUser) return { error: "Faculty member not found." }
    if (targetUser.role !== "FACULTY") {
      return { error: "Can only assign areas to faculty members." }
    }

    // Verify area exists
    const area = await prisma.area.findUnique({
      where: { id: validated.areaId },
    })
    if (!area) return { error: "Area not found." }

    // Verify criterion belongs to area (if provided)
    if (validated.criterionId) {
      const criterion = await prisma.criterion.findUnique({
        where: { id: validated.criterionId },
      })
      if (!criterion || criterion.areaId !== validated.areaId) {
        return { error: "Criterion does not belong to the selected area." }
      }
    }

    // @@unique([userId, areaId, criterionId]) handles duplicate guard at DB level
    const assignment = await prisma.assignment.create({
      data: {
        userId: validated.userId,
        areaId: validated.areaId,
        criterionId: validated.criterionId ?? null,
        notes: validated.notes ?? null,
      },
    })

    // Notify the faculty member
    await prisma.notification.create({
      data: {
        userId: validated.userId,
        message: `You have been assigned to ${area.name}${validated.criterionId ? " — a specific criterion" : " (all criteria)"}.`,
        type: "ASSIGNMENT",
        link: `/faculty/dashboard`,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_ASSIGNMENT",
        module: "ASSIGNMENT",
        targetId: assignment.id,
        details: {
          facultyId: validated.userId,
          facultyName: targetUser.name,
          areaId: validated.areaId,
          areaName: area.name,
          criterionId: validated.criterionId ?? null,
        },
      },
    })

    revalidatePath("/admin/assignments")
    return { success: true, data: { id: assignment.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    // Prisma unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { error: "This assignment already exists for this faculty member." }
    }
    console.error("[createAssignment]", error)
    return { error: "Failed to create assignment." }
  }
}

// ─── DELETE ASSIGNMENT (Admin only) ──────────────────────────────────────────

export async function deleteAssignment(
  assignmentId: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        user: { select: { name: true } },
        area: { select: { name: true } },
      },
    })
    if (!assignment) return { error: "Assignment not found." }

    await prisma.assignment.delete({ where: { id: assignmentId } })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_ASSIGNMENT",
        module: "ASSIGNMENT",
        targetId: assignmentId,
        details: {
          facultyName: assignment.user.name,
          areaName: assignment.area.name,
        },
      },
    })

    revalidatePath("/admin/assignments")
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[deleteAssignment]", error)
    return { error: "Failed to delete assignment." }
  }
}
