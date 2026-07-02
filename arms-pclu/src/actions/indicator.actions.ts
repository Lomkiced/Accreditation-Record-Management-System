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

const IndicatorSchema = z.object({
  criterionId: z.string().uuid("Invalid criterion ID"),
  name: z.string().min(1, "Indicator name is required").max(255),
  requiredDocs: z.string().optional(),
  ratingScale: z.number().int().min(1).max(10).default(5),
  order: z.number().int().nonnegative().optional(),
})

const UpdateIndicatorSchema = IndicatorSchema.omit({ criterionId: true })

// ─── GET INDICATORS BY CRITERION ─────────────────────────────────────────────

export async function getIndicatorsByCriterion(criterionId: string) {
  try {
    await requireUser()

    if (!criterionId) return { error: "Criterion ID is required." }

    const indicators = await prisma.indicator.findMany({
      where: { criterionId },
      orderBy: { order: "asc" },
      include: {
        mappings: {
          select: {
            id: true,
            status: true,
            rating: true,
            createdAt: true,
            document: {
              select: { id: true, title: true, fileName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return { success: true as const, data: indicators }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getIndicatorsByCriterion]", error)
    return { error: "Failed to load indicators." }
  }
}

export type IndicatorWithMappings = NonNullable<
  Extract<Awaited<ReturnType<typeof getIndicatorsByCriterion>>, { success: true }>["data"]
>[number]

// ─── CREATE INDICATOR ────────────────────────────────────────────────────────

export async function createIndicator(
  formData: z.infer<typeof IndicatorSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin()

    const validated = IndicatorSchema.parse({
      criterionId: formData.criterionId,
      name: sanitizeString(formData.name),
      requiredDocs: formData.requiredDocs
        ? sanitizeString(formData.requiredDocs)
        : undefined,
      ratingScale: formData.ratingScale,
      order: formData.order,
    })

    // Verify the parent criterion exists
    const criterion = await prisma.criterion.findUnique({
      where: { id: validated.criterionId },
    })
    if (!criterion) return { error: "Parent criterion not found." }

    // Auto-set order to the end if not provided
    const maxOrder = await prisma.indicator.aggregate({
      where: { criterionId: validated.criterionId },
      _max: { order: true },
    })
    const nextOrder =
      validated.order ?? (maxOrder._max.order ?? -1) + 1

    const indicator = await prisma.indicator.create({
      data: {
        criterionId: validated.criterionId,
        name: validated.name,
        requiredDocs: validated.requiredDocs ?? null,
        ratingScale: validated.ratingScale,
        order: nextOrder,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_INDICATOR",
        module: "AREA",
        targetId: indicator.id,
        details: {
          criterionId: validated.criterionId,
          name: indicator.name,
        },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true, data: { id: indicator.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[createIndicator]", error)
    return { error: "Failed to create indicator." }
  }
}

// ─── UPDATE INDICATOR ────────────────────────────────────────────────────────

export async function updateIndicator(
  indicatorId: string,
  formData: z.infer<typeof UpdateIndicatorSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const validated = UpdateIndicatorSchema.parse({
      name: sanitizeString(formData.name),
      requiredDocs: formData.requiredDocs
        ? sanitizeString(formData.requiredDocs)
        : undefined,
      ratingScale: formData.ratingScale,
      order: formData.order,
    })

    const existing = await prisma.indicator.findUnique({
      where: { id: indicatorId },
    })
    if (!existing) return { error: "Indicator not found." }

    await prisma.indicator.update({
      where: { id: indicatorId },
      data: {
        name: validated.name,
        requiredDocs: validated.requiredDocs ?? null,
        ratingScale: validated.ratingScale,
        ...(validated.order !== undefined && { order: validated.order }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_INDICATOR",
        module: "AREA",
        targetId: indicatorId,
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
    console.error("[updateIndicator]", error)
    return { error: "Failed to update indicator." }
  }
}

// ─── DELETE INDICATOR ────────────────────────────────────────────────────────

export async function deleteIndicator(
  indicatorId: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const existing = await prisma.indicator.findUnique({
      where: { id: indicatorId },
    })
    if (!existing) return { error: "Indicator not found." }

    // Cascade: schema cascades mappings automatically. Central documents are untouched.
    await prisma.indicator.delete({ where: { id: indicatorId } })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_INDICATOR",
        module: "AREA",
        targetId: indicatorId,
        details: {
          name: existing.name,
          criterionId: existing.criterionId,
        },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[deleteIndicator]", error)
    return { error: "Failed to delete indicator." }
  }
}
