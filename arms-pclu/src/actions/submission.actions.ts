"use server"

import { prisma } from "@/lib/prisma"
import { requireUser, requireAdmin } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { sanitizeString } from "@/lib/sanitize"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

// ─── Validation Schema ────────────────────────────────────────────────────────

const uploadAndMapSchema = z.object({
  indicatorId: z.string().uuid("Invalid indicator ID"),
  title: z.string().min(1, "Document title is required").max(255),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive("File size must be positive"),
  rating: z.number().int().min(1).max(10).optional(),
})

const saveDraftSchema = z.object({
  indicatorId: z.string().uuid("Invalid indicator ID"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  rating: z.number().int().min(1).max(10).optional(),
})

// ─── UPLOAD AND MAP DOCUMENT (atomic) ────────────────────────────────────────
//
// Wraps document creation + mapping creation in a single Prisma $transaction.
// If the mapping insert fails for any reason (e.g., duplicate), the document
// record is NOT created — the entire transaction rolls back atomically.
// Status is set to SUBMITTED immediately (ready for admin review).
//
export async function uploadAndMapDocument(
  formData: z.infer<typeof uploadAndMapSchema>
): Promise<ActionResult<{ documentId: string; mappingId: string }>> {
  try {
    const currentUser = await requireUser()

    const validated = uploadAndMapSchema.parse({
      ...formData,
      title: sanitizeString(formData.title),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
    })

    // Verify the indicator exists
    const indicator = await prisma.indicator.findUnique({
      where: { id: validated.indicatorId },
      select: {
        id: true,
        name: true,
        criterion: {
          select: {
            name: true,
            area: { select: { name: true } },
          },
        },
      },
    })
    if (!indicator) return { error: "Indicator not found." }

    // Check if the faculty already has a non-returned mapping for this indicator
    const existingMapping = await prisma.documentMapping.findFirst({
      where: {
        indicatorId: validated.indicatorId,
        userId: currentUser.id,
        status: { notIn: ["RETURNED"] },
      },
    })
    if (existingMapping) {
      return {
        error:
          "You already have an active submission for this indicator. Delete or wait for it to be returned before resubmitting.",
      }
    }

    // Atomic transaction: Document + DocumentMapping together
    const [document, mapping] = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          userId: currentUser.id,
          title: validated.title,
          description: validated.description ?? null,
          documentDate: new Date(validated.documentDate),
          fileUrl: validated.fileUrl,
          fileName: validated.fileName,
          fileSize: validated.fileSize,
          version: 1,
        },
      })

      const map = await tx.documentMapping.create({
        data: {
          documentId: doc.id,
          indicatorId: validated.indicatorId,
          userId: currentUser.id,
          status: "SUBMITTED",
          rating: validated.rating ?? null,
        },
      })

      return [doc, map]
    })

    // Audit log (outside transaction — non-critical)
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "SUBMIT_DOCUMENT",
        module: "DOCUMENT",
        targetId: document.id,
        details: {
          documentTitle: document.title,
          indicatorId: validated.indicatorId,
          indicatorName: indicator.name,
          mappingId: mapping.id,
        },
      },
    })

    revalidatePath("/faculty/submissions")
    revalidatePath("/admin/submissions")
    revalidatePath("/admin/dashboard")

    return {
      success: true,
      data: { documentId: document.id, mappingId: mapping.id },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "You must be logged in to submit documents." }
    }
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return {
        error: "A submission for this document and indicator already exists.",
      }
    }
    console.error("[uploadAndMapDocument]", error)
    return { error: "Failed to submit document. Please try again." }
  }
}

// ─── SAVE DOCUMENT AS DRAFT ───────────────────────────────────────────────────
//
// Creates a Document + mapping with status DRAFT.
// Also wrapped in a transaction.
//
export async function saveDocumentAsDraft(
  formData: z.infer<typeof saveDraftSchema>
): Promise<ActionResult<{ documentId: string; mappingId: string }>> {
  try {
    const currentUser = await requireUser()

    const validated = saveDraftSchema.parse({
      ...formData,
      title: sanitizeString(formData.title),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
    })

    // Verify indicator
    const indicator = await prisma.indicator.findUnique({
      where: { id: validated.indicatorId },
      select: { id: true, name: true },
    })
    if (!indicator) return { error: "Indicator not found." }

    const [document, mapping] = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          userId: currentUser.id,
          title: validated.title,
          description: validated.description ?? null,
          documentDate: new Date(validated.documentDate),
          fileUrl: validated.fileUrl ?? null,
          fileName: validated.fileName ?? null,
          fileSize: validated.fileSize ?? null,
          version: 1,
        },
      })

      const map = await tx.documentMapping.create({
        data: {
          documentId: doc.id,
          indicatorId: validated.indicatorId,
          userId: currentUser.id,
          status: "DRAFT",
          rating: validated.rating ?? null,
        },
      })

      return [doc, map]
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "SAVE_DRAFT",
        module: "DOCUMENT",
        targetId: document.id,
        details: {
          documentTitle: document.title,
          indicatorId: validated.indicatorId,
          mappingId: mapping.id,
        },
      },
    })

    revalidatePath("/faculty/submissions")

    return {
      success: true,
      data: { documentId: document.id, mappingId: mapping.id },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "You must be logged in." }
    }
    console.error("[saveDocumentAsDraft]", error)
    return { error: "Failed to save draft. Please try again." }
  }
}

// ─── GET MY SUBMISSIONS (Faculty view) ───────────────────────────────────────
// Returns all DocumentMappings for the current user, fully joined.

export async function getMySubmissions() {
  try {
    const currentUser = await requireUser()

    const mappings = await prisma.documentMapping.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            description: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            documentDate: true,
            version: true,
            createdAt: true,
            versions: {
              orderBy: { version: "desc" },
              select: {
                id: true,
                version: true,
                fileUrl: true,
                fileName: true,
                fileSize: true,
                remarks: true,
                createdAt: true,
              },
            },
            tags: {
              include: {
                tag: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
        indicator: {
          select: {
            id: true,
            name: true,
            requiredDocs: true,
            ratingScale: true,
            criterion: {
              select: {
                id: true,
                name: true,
                area: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    return { success: true as const, data: mappings }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getMySubmissions]", error)
    return { error: "Failed to load submissions." }
  }
}

export type MySubmission = NonNullable<
  Extract<Awaited<ReturnType<typeof getMySubmissions>>, { success: true }>["data"]
>[number]

// ─── GET ALL SUBMISSIONS (Admin view) ────────────────────────────────────────
// Returns all DocumentMappings across the system, fully joined.

export async function getAllSubmissions() {
  try {
    await requireAdmin()

    const mappings = await prisma.documentMapping.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        document: {
          select: {
            id: true,
            title: true,
            description: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            documentDate: true,
            version: true,
            createdAt: true,
            versions: {
              orderBy: { version: "desc" },
              select: {
                id: true,
                version: true,
                fileUrl: true,
                fileName: true,
                fileSize: true,
                remarks: true,
                createdAt: true,
              },
            },
            tags: {
              include: {
                tag: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
        indicator: {
          select: {
            id: true,
            name: true,
            requiredDocs: true,
            ratingScale: true,
            criterion: {
              select: {
                id: true,
                name: true,
                area: { select: { id: true, name: true, order: true } },
              },
            },
          },
        },
      },
    })

    return { success: true as const, data: mappings }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[getAllSubmissions]", error)
    return { error: "Failed to load submissions." }
  }
}

export type AdminSubmission = NonNullable<
  Extract<Awaited<ReturnType<typeof getAllSubmissions>>, { success: true }>["data"]
>[number]

// ─── REVIEW SUBMISSION (Admin only) ──────────────────────────────────────────

const reviewSubmissionSchema = z.object({
  mappingId: z.string().uuid("Invalid mapping ID"),
  status: z.enum(["APPROVED", "RETURNED"]),
  remarks: z.string().optional(),
})

export async function reviewSubmission(
  formData: z.infer<typeof reviewSubmissionSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const validated = reviewSubmissionSchema.parse(formData)

    if (validated.status === "RETURNED" && (!validated.remarks || validated.remarks.trim() === "")) {
      return { error: "Remarks are required when returning a submission." }
    }

    const mapping = await prisma.documentMapping.findUnique({
      where: { id: validated.mappingId },
      include: { 
        document: { select: { title: true } }, 
        user: { select: { id: true, name: true } },
        indicator: { select: { name: true } }
      }
    })

    if (!mapping) return { error: "Submission not found." }

    // Update the mapping status and remarks
    await prisma.documentMapping.update({
      where: { id: validated.mappingId },
      data: {
        status: validated.status,
        remarks: validated.remarks ?? null
      }
    })

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "REVIEW_MAPPING",
        module: "REVIEW",
        targetId: mapping.id,
        details: {
          status: validated.status,
          remarks: validated.remarks,
          facultyName: mapping.user.name,
          documentTitle: mapping.document.title,
          indicatorName: mapping.indicator.name
        }
      }
    })

    // Notify the faculty
    await prisma.notification.create({
      data: {
        userId: mapping.user.id,
        message: `Your submission "${mapping.document.title}" for "${mapping.indicator.name}" has been ${validated.status.toLowerCase()}.${validated.remarks ? ' See remarks.' : ''}`,
        type: "REVIEW",
        link: `/faculty/submissions`
      }
    })

    revalidatePath("/admin/submissions")
    revalidatePath("/faculty/submissions")
    revalidatePath("/admin/dashboard")

    return { success: true }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[reviewSubmission]", error)
    return { error: "Failed to review submission." }
  }
}
