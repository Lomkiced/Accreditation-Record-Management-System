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

const CriterionSchema = z.object({
  areaId: z.string().uuid("Invalid area ID"),
  name: z.string().min(1, "Criterion name is required").max(255),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
})

const UpdateCriterionSchema = CriterionSchema.omit({ areaId: true })

// ─── GET CRITERIA BY AREA ─────────────────────────────────────────────────────

export async function getCriteriaByArea(areaId: string) {
  try {
    await requireUser()

    if (!areaId) return { error: "Area ID is required." }

    const criteria = await prisma.criterion.findMany({
      where: { areaId },
      orderBy: { order: "asc" },
      include: {
        indicators: {
          orderBy: { order: "asc" },
          include: {
            mappings: {
              select: { status: true },
            },
          },
        },
      },
    })

    return { success: true as const, data: criteria }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getCriteriaByArea]", error)
    return { error: "Failed to load criteria." }
  }
}

export type CriterionWithIndicators = NonNullable<
  Extract<Awaited<ReturnType<typeof getCriteriaByArea>>, { success: true }>["data"]
>[number]

// ─── CREATE CRITERION ────────────────────────────────────────────────────────

export async function createCriterion(
  formData: z.infer<typeof CriterionSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin()

    const validated = CriterionSchema.parse({
      areaId: formData.areaId,
      name: sanitizeString(formData.name),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
      order: formData.order,
    })

    // Verify the parent area exists
    const area = await prisma.area.findUnique({ where: { id: validated.areaId } })
    if (!area) return { error: "Parent area not found." }

    // Auto-set order to the end if not provided
    const maxOrder = await prisma.criterion.aggregate({
      where: { areaId: validated.areaId },
      _max: { order: true },
    })
    const nextOrder =
      validated.order ?? (maxOrder._max.order ?? -1) + 1

    const criterion = await prisma.criterion.create({
      data: {
        areaId: validated.areaId,
        name: validated.name,
        description: validated.description ?? null,
        order: nextOrder,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_CRITERION",
        module: "AREA",
        targetId: criterion.id,
        details: { areaId: validated.areaId, name: criterion.name },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true, data: { id: criterion.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[createCriterion]", error)
    return { error: "Failed to create criterion." }
  }
}

// ─── UPDATE CRITERION ────────────────────────────────────────────────────────

export async function updateCriterion(
  criterionId: string,
  formData: z.infer<typeof UpdateCriterionSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const validated = UpdateCriterionSchema.parse({
      name: sanitizeString(formData.name),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
      order: formData.order,
    })

    const existing = await prisma.criterion.findUnique({
      where: { id: criterionId },
    })
    if (!existing) return { error: "Criterion not found." }

    await prisma.criterion.update({
      where: { id: criterionId },
      data: {
        name: validated.name,
        description: validated.description ?? null,
        ...(validated.order !== undefined && { order: validated.order }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_CRITERION",
        module: "AREA",
        targetId: criterionId,
        details: { name: validated.name },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[updateCriterion]", error)
    return { error: "Failed to update criterion." }
  }
}

// ─── DELETE CRITERION ────────────────────────────────────────────────────────

export async function deleteCriterion(
  criterionId: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const existing = await prisma.criterion.findUnique({
      where: { id: criterionId },
    })
    if (!existing) return { error: "Criterion not found." }

    // Cascade: schema cascades indicators → mappings automatically
    await prisma.criterion.delete({ where: { id: criterionId } })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_CRITERION",
        module: "AREA",
        targetId: criterionId,
        details: { name: existing.name, areaId: existing.areaId },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[deleteCriterion]", error)
    return { error: "Failed to delete criterion." }
  }
}
