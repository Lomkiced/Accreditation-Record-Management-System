"use server"

"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"
import { z } from "zod"

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color code"),
})

export type TagWithUsage = {
  id: string
  name: string
  color: string
  type: "SYSTEM" | "CUSTOM"
  documentsCount: number
  createdAt: string
}

export async function getTagsWithUsage(): Promise<ActionResult<TagWithUsage[]>> {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { documents: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    const data: TagWithUsage[] = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      type: tag.type,
      documentsCount: tag._count.documents,
      createdAt: new Date(tag.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }))

    return { success: true, data }
  } catch (error) {
    console.error("[getTagsWithUsage]", error)
    return { error: "Failed to load tags." }
  }
}

export async function createCustomTag(input: z.infer<typeof tagSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const validated = tagSchema.parse(input)

    await prisma.tag.create({
      data: {
        name: validated.name,
        color: validated.color,
        type: "CUSTOM"
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_TAG",
        module: "TAG_MANAGEMENT",
        details: { tagName: validated.name, color: validated.color }
      }
    })

    revalidatePath("/admin/tags")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0]?.message ?? "Validation failed." }
    if (error instanceof Error && error.message.includes("Unique constraint")) return { error: "Tag name already exists." }
    console.error("[createCustomTag]", error)
    return { error: "Failed to create tag." }
  }
}

export async function updateCustomTag(tagId: string, input: z.infer<typeof tagSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const validated = tagSchema.parse(input)

    const tag = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!tag) return { error: "Tag not found." }
    if (tag.type === "SYSTEM") return { error: "System tags cannot be modified." }

    await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: validated.name,
        color: validated.color,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_TAG",
        module: "TAG_MANAGEMENT",
        targetId: tagId,
        details: { newName: validated.name, newColor: validated.color }
      }
    })

    revalidatePath("/admin/tags")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0]?.message ?? "Validation failed." }
    if (error instanceof Error && error.message.includes("Unique constraint")) return { error: "Tag name already exists." }
    console.error("[updateCustomTag]", error)
    return { error: "Failed to update tag." }
  }
}

export async function deleteCustomTag(tagId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    
    const tag = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!tag) return { error: "Tag not found." }
    if (tag.type === "SYSTEM") return { error: "System tags cannot be deleted." }

    await prisma.tag.delete({ where: { id: tagId } })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_TAG",
        module: "TAG_MANAGEMENT",
        targetId: tagId,
        details: { tagName: tag.name }
      }
    })

    revalidatePath("/admin/tags")
    return { success: true }
  } catch (error) {
    console.error("[deleteCustomTag]", error)
    return { error: "Failed to delete tag." }
  }
}

