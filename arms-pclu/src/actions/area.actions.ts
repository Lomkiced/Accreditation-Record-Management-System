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

const AreaSchema = z.object({
  name: z.string().min(1, "Area name is required").max(255),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
})

const ReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
})

// ─── Nested include shape (shared) ────────────────────────────────────────────

export const AREA_FULL_INCLUDE = {
  criteria: {
    orderBy: { order: "asc" as const },
    include: {
      indicators: {
        orderBy: { order: "asc" as const },
        include: {
          mappings: {
            select: {
              id: true,
              status: true,
              rating: true,
              createdAt: true,
              document: {
                select: {
                  id: true,
                  title: true,
                  fileName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
        },
      },
    },
  },
} as const


// ─── GET AREAS ────────────────────────────────────────────────────────────────

export async function getAreas() {
  try {
    await requireUser()

    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      include: AREA_FULL_INCLUDE,
    })

    return { success: true as const, data: areas }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getAreas]", error)
    return { error: "Failed to load areas." }
  }
}

export type AreasData = Awaited<ReturnType<typeof getAreas>>
export type AreaWithHierarchy = NonNullable<
  Extract<AreasData, { success: true }>["data"]
>[number]

// ─── CREATE AREA ─────────────────────────────────────────────────────────────

export async function createArea(
  formData: z.infer<typeof AreaSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin()

    const validated = AreaSchema.parse({
      name: sanitizeString(formData.name),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
      order: formData.order,
    })

    // Auto-set order to the end if not provided
    const maxOrder = await prisma.area.aggregate({ _max: { order: true } })
    const nextOrder =
      validated.order ?? (maxOrder._max.order ?? -1) + 1

    const area = await prisma.area.create({
      data: {
        name: validated.name,
        description: validated.description ?? null,
        order: nextOrder,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_AREA",
        module: "AREA",
        targetId: area.id,
        details: { name: area.name },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true, data: { id: area.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[createArea]", error)
    return { error: "Failed to create area." }
  }
}

// ─── UPDATE AREA ─────────────────────────────────────────────────────────────

export async function updateArea(
  areaId: string,
  formData: z.infer<typeof AreaSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const validated = AreaSchema.parse({
      name: sanitizeString(formData.name),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
      order: formData.order,
    })

    const existing = await prisma.area.findUnique({ where: { id: areaId } })
    if (!existing) return { error: "Area not found." }

    await prisma.area.update({
      where: { id: areaId },
      data: {
        name: validated.name,
        description: validated.description ?? null,
        ...(validated.order !== undefined && { order: validated.order }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_AREA",
        module: "AREA",
        targetId: areaId,
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
    console.error("[updateArea]", error)
    return { error: "Failed to update area." }
  }
}

// ─── DELETE AREA ─────────────────────────────────────────────────────────────

export async function deleteArea(areaId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const existing = await prisma.area.findUnique({ where: { id: areaId } })
    if (!existing) return { error: "Area not found." }

    // Cascade: schema cascades criteria → indicators → mappings automatically
    await prisma.area.delete({ where: { id: areaId } })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_AREA",
        module: "AREA",
        targetId: areaId,
        details: { name: existing.name },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[deleteArea]", error)
    return { error: "Failed to delete area." }
  }
}

// ─── REORDER AREAS ────────────────────────────────────────────────────────────

export async function reorderAreas(
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const validated = ReorderSchema.parse({ orderedIds })

    await prisma.$transaction(
      validated.orderedIds.map((id, index) =>
        prisma.area.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "REORDER_AREAS",
        module: "AREA",
        details: { orderedIds: validated.orderedIds },
      },
    })

    revalidatePath("/admin/areas")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid area IDs provided." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[reorderAreas]", error)
    return { error: "Failed to reorder areas." }
  }
}
