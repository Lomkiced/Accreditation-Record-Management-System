"use server"

import { prisma } from "@/lib/prisma"
import { requireUser, requireAdmin, requireAdminOrDean } from "@/lib/auth/getUser"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { sanitizeString } from "@/lib/sanitize"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

// ─── Validation Schema ────────────────────────────────────────────────────────

const uploadAndMapSchema = z.object({
  indicatorId: z.string().uuid("Invalid indicator ID"),
  documentId: z.string().uuid("Invalid document ID").optional(),
  title: z.string().min(1, "Document title is required").max(255),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive("File size must be positive"),
  rating: z.number().int().min(1).max(10).optional(),
})

const uploadAndMapBatchSchema = z.object({
  indicatorId: z.string().uuid("Invalid indicator ID"),
  documentDate: z.string().min(1, "Document date is required"),
  files: z.array(
    z.object({
      title: z.string().min(1, "Title is required").max(255),
      description: z.string().optional(),
      fileUrl: z.string().url("Invalid file URL"),
      fileName: z.string().min(1, "File name is required"),
      fileSize: z.number().positive("File size must be positive"),
    })
  ).min(1, "At least one file is required"),
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
        requiredDocs: true,
        criterion: {
          select: {
            name: true,
            area: { select: { name: true } },
          },
        },
      },
    })
    if (!indicator) return { error: "Indicator not found." }

    // Case 1: Updating an explicit existing document in-place
    if (validated.documentId) {
      const existingDoc = await prisma.document.findUnique({
        where: { id: validated.documentId },
        include: { mappings: true },
      })

      if (!existingDoc) return { error: "Document to update not found." }
      if (existingDoc.userId !== currentUser.id) {
        return { error: "You do not have permission to update this document." }
      }

      const [updatedDoc, mapping] = await prisma.$transaction(async (tx) => {
        // Create version snapshot of the previous state
        if (existingDoc.fileUrl) {
          await tx.documentVersion.create({
            data: {
              documentId: existingDoc.id,
              fileUrl: existingDoc.fileUrl,
              fileName: existingDoc.fileName ?? "Previous version",
              fileSize: existingDoc.fileSize,
              version: existingDoc.version,
              remarks: "Updated by faculty",
            },
          })
        }

        // Update document in-place, increment version
        const d = await tx.document.update({
          where: { id: existingDoc.id },
          data: {
            title: validated.title,
            description: validated.description ?? null,
            documentDate: new Date(validated.documentDate),
            fileUrl: validated.fileUrl,
            fileName: validated.fileName,
            fileSize: validated.fileSize,
            version: existingDoc.version + 1,
          },
        })

        // Update or create mapping for this indicator
        const existingMapping = existingDoc.mappings.find(
          (m) => m.indicatorId === validated.indicatorId
        )

        let m
        if (existingMapping) {
          m = await tx.documentMapping.update({
            where: { id: existingMapping.id },
            data: {
              status: "SUBMITTED",
              rating: validated.rating ?? null,
              remarks: null,
            },
          })
        } else {
          m = await tx.documentMapping.create({
            data: {
              documentId: d.id,
              indicatorId: validated.indicatorId,
              userId: currentUser.id,
              status: "SUBMITTED",
              rating: validated.rating ?? null,
            },
          })
        }

        return [d, m]
      })

      await Promise.allSettled([
        prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: "UPLOAD_NEW_VERSION",
            module: "DOCUMENT",
            targetId: updatedDoc.id,
            details: {
              documentTitle: updatedDoc.title,
              indicatorName: indicator.name,
              newVersion: updatedDoc.version,
            },
          },
        }),
        prisma.user.findMany({
          where: { role: { in: ["ADMIN", "DEAN"] }, isActive: true },
          select: { id: true, role: true },
        }).then((reviewers) => {
          if (reviewers.length > 0) {
            return prisma.notification.createMany({
              data: reviewers.map((r) => ({
                userId: r.id,
                message: `${currentUser.name} uploaded an updated version of "${updatedDoc.title}".`,
                type: "SUBMISSION",
                link: r.role === "ADMIN" ? "/admin/submissions" : "/dean/submissions",
              })),
            })
          }
        }),
      ]).catch(console.error)

      revalidatePath("/faculty/submissions")
      revalidatePath("/admin/submissions")
      revalidatePath("/dean/submissions")
      revalidatePath("/admin/dashboard")
      revalidatePath("/dean/dashboard")
      revalidateTag("areas-hierarchy")
      revalidateTag("dashboard")

      return {
        success: true,
        data: { documentId: updatedDoc.id, mappingId: mapping.id },
      }
    }

    // Find all user mappings for this indicator
    const allUserMappingsForIndicator = await prisma.documentMapping.findMany({
      where: {
        indicatorId: validated.indicatorId,
        userId: currentUser.id,
      },
      include: { document: true },
    })

    // Check if they are returning an existing draft/returned document without explicit doc ID
    const returnedMapping = allUserMappingsForIndicator.find(
      (m) => m.status === "RETURNED" || m.status === "DRAFT"
    )

    let documentId: string
    let mappingId: string

    if (returnedMapping) {
      // It IS returned or draft, so we update the document (creates V2)
      const [doc, map] = await prisma.$transaction(async (tx) => {
        // Snapshot previous version if fileUrl existed
        if (returnedMapping.document.fileUrl) {
          await tx.documentVersion.create({
            data: {
              documentId: returnedMapping.documentId,
              fileUrl: returnedMapping.document.fileUrl,
              fileName: returnedMapping.document.fileName ?? "Previous version",
              fileSize: returnedMapping.document.fileSize,
              version: returnedMapping.document.version,
              remarks: returnedMapping.remarks ?? "Resubmitted by faculty",
            },
          })
        }

        const d = await tx.document.update({
          where: { id: returnedMapping.documentId },
          data: {
            title: validated.title,
            description: validated.description ?? null,
            documentDate: new Date(validated.documentDate),
            fileUrl: validated.fileUrl,
            fileName: validated.fileName,
            fileSize: validated.fileSize,
            version: returnedMapping.document.version + 1,
          },
        })

        const m = await tx.documentMapping.update({
          where: { id: returnedMapping.id },
          data: {
            status: "SUBMITTED",
            rating: validated.rating ?? null,
            remarks: null,
          },
        })

        return [d, m]
      })
      documentId = doc.id
      mappingId = map.id
    } else {
      // Atomic transaction: Document + DocumentMapping together (V1)
      const [doc, map] = await prisma.$transaction(async (tx) => {
        const d = await tx.document.create({
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

        const m = await tx.documentMapping.create({
          data: {
            documentId: d.id,
            indicatorId: validated.indicatorId,
            userId: currentUser.id,
            status: "SUBMITTED",
            rating: validated.rating ?? null,
          },
        })

        return [d, m]
      })
      documentId = doc.id
      mappingId = map.id
    }

    // Audit log and notifications (concurrent, non-critical)
    await Promise.allSettled([
      prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: returnedMapping ? "RESUBMIT_DOCUMENT" : "SUBMIT_DOCUMENT",
          module: "DOCUMENT",
          targetId: documentId,
          details: {
            documentTitle: validated.title,
            indicatorName: indicator.name,
          },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "DEAN"] }, isActive: true },
        select: { id: true, role: true },
      }).then(reviewers => {
        if (reviewers.length > 0) {
          return prisma.notification.createMany({
            data: reviewers.map((r) => ({
              userId: r.id,
              message: `${currentUser.name} has submitted "${validated.title}" for review.`,
              type: "SUBMISSION",
              link: r.role === "ADMIN" ? "/admin/submissions" : "/dean/submissions",
            })),
          })
        }
      })
    ]).catch(console.error)

    revalidatePath("/faculty/submissions")
    revalidatePath("/admin/submissions")
    revalidatePath("/dean/submissions")
    revalidatePath("/admin/dashboard")
    revalidatePath("/dean/dashboard")
    revalidateTag("areas-hierarchy")
    revalidateTag("dashboard")

    return {
      success: true,
      data: { documentId: documentId, mappingId: mappingId },
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

// ─── UPLOAD AND MAP BATCH DOCUMENTS ──────────────────────────────────────────
//
// Supports uploading multiple evidence documents in a single operation.
//
export async function uploadAndMapBatchDocuments(
  formData: z.infer<typeof uploadAndMapBatchSchema>
): Promise<ActionResult<{ count: number; documentIds: string[] }>> {
  try {
    const currentUser = await requireUser()
    const validated = uploadAndMapBatchSchema.parse(formData)

    const indicator = await prisma.indicator.findUnique({
      where: { id: validated.indicatorId },
      select: { id: true, name: true },
    })
    if (!indicator) return { error: "Indicator not found." }

    const createdDocs = await prisma.$transaction(async (tx) => {
      const results: string[] = []
      for (const item of validated.files) {
        const doc = await tx.document.create({
          data: {
            userId: currentUser.id,
            title: sanitizeString(item.title),
            description: item.description ? sanitizeString(item.description) : null,
            documentDate: new Date(validated.documentDate),
            fileUrl: item.fileUrl,
            fileName: item.fileName,
            fileSize: item.fileSize,
            version: 1,
          },
        })

        await tx.documentMapping.create({
          data: {
            documentId: doc.id,
            indicatorId: validated.indicatorId,
            userId: currentUser.id,
            status: "SUBMITTED",
          },
        })

        results.push(doc.id)
      }
      return results
    })

    // Audit log & Notifications
    await Promise.allSettled([
      prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "SUBMIT_DOCUMENT",
          module: "DOCUMENT",
          targetId: createdDocs[0] || indicator.id,
          details: {
            count: createdDocs.length,
            indicatorName: indicator.name,
            batch: true,
          },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "DEAN"] }, isActive: true },
        select: { id: true, role: true },
      }).then((reviewers) => {
        if (reviewers.length > 0) {
          return prisma.notification.createMany({
            data: reviewers.map((r) => ({
              userId: r.id,
              message: `${currentUser.name} uploaded ${createdDocs.length} evidence documents for "${indicator.name}".`,
              type: "SUBMISSION",
              link: r.role === "ADMIN" ? "/admin/submissions" : "/dean/submissions",
            })),
          })
        }
      }),
    ]).catch(console.error)

    revalidatePath("/faculty/submissions")
    revalidatePath("/admin/submissions")
    revalidatePath("/dean/submissions")
    revalidatePath("/admin/dashboard")
    revalidatePath("/dean/dashboard")
    revalidateTag("areas-hierarchy")
    revalidateTag("dashboard")

    return {
      success: true,
      data: { count: createdDocs.length, documentIds: createdDocs },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "You must be logged in to submit documents." }
    }
    console.error("[uploadAndMapBatchDocuments]", error)
    return { error: "Failed to upload batch documents. Please try again." }
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

    await Promise.allSettled([
      prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "SAVE_DRAFT",
          module: "DOCUMENT",
          targetId: document.id,
          details: {
            documentTitle: document.title,
          },
        },
      })
    ]).catch(console.error)

    revalidatePath("/faculty/submissions")
    revalidateTag("dashboard")

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

// ─── ARCHIVE DOCUMENT (Soft Delete) ───────────────────────────────────────────

export async function archiveDocument(documentId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!doc) return { error: "Document not found." }
    if (doc.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "Unauthorized. Only the owner or an admin can archive this document." }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { isArchived: true },
    })

    revalidatePath("/faculty/dashboard")
    revalidatePath("/faculty/submissions")
    revalidatePath("/faculty/archives")

    return { success: true }
  } catch (error: any) {
    console.error("[archiveDocument]", error)
    return { error: "Failed to archive document." }
  }
}

// ─── RESTORE DOCUMENT ─────────────────────────────────────────────────────────

export async function restoreDocument(documentId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!doc) return { error: "Document not found." }
    if (doc.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "Unauthorized. Only the owner or an admin can restore this document." }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { isArchived: false },
    })

    revalidatePath("/faculty/dashboard")
    revalidatePath("/faculty/submissions")
    revalidatePath("/faculty/archives")

    return { success: true }
  } catch (error: any) {
    console.error("[restoreDocument]", error)
    return { error: "Failed to restore document." }
  }
}

// ─── PERMANENTLY DELETE DOCUMENT ──────────────────────────────────────────────

export async function permanentlyDeleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!doc) return { error: "Document not found." }
    if (doc.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "Unauthorized. Only the owner or an admin can permanently delete this document." }
    }

    // In a full implementation, you would also delete the file from Supabase Storage here using `doc.fileUrl`
    
    await prisma.document.delete({
      where: { id: documentId },
    })

    revalidatePath("/faculty/archives")

    return { success: true }
  } catch (error: any) {
    console.error("[permanentlyDeleteDocument]", error)
    return { error: "Failed to permanently delete document." }
  }
}

// ─── GET ARCHIVED DOCUMENTS ───────────────────────────────────────────────────

export async function getArchivedDocuments() {
  try {
    const currentUser = await requireUser()
    const documents = await prisma.document.findMany({
      where: {
        userId: currentUser.id,
        isArchived: true,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        documentDate: true,
        version: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        mappings: {
          select: {
            id: true,
            status: true,
            rating: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            indicatorId: true,
            documentId: true,
            userId: true,
            indicator: {
              select: {
                id: true,
                name: true,
                requiredDocs: true,
                order: true,
                criterionId: true,
                criterion: {
                  select: {
                    id: true,
                    name: true,
                    order: true,
                    areaId: true,
                    area: {
                      select: { id: true, name: true, order: true },
                    },
                  },
                },
              },
            },
          },
        },
        tags: {
          select: {
            id: true,
            tagId: true,
            documentId: true,
            tag: { select: { id: true, name: true, color: true } },
          },
        },
      },
    })

    return { success: true, data: documents }
  } catch (error: any) {
    console.error("[getArchivedDocuments]", error)
    return { success: false, error: "Failed to fetch archived documents." }
  }
}

// ─── GET MY SUBMISSIONS (Faculty view) ───────────────────────────────────────

export async function getMySubmissions() {
  try {
    const currentUser = await requireUser()
    const mappings = await prisma.documentMapping.findMany({
      where: {
        userId: currentUser.id,
        document: { isArchived: false },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        rating: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        documentId: true,
        indicatorId: true,
        userId: true,
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
              select: {
                id: true,
                tagId: true,
                documentId: true,
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
    await requireAdminOrDean()

    const mappings = await prisma.documentMapping.findMany({
      where: { document: { isArchived: false } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        rating: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        documentId: true,
        indicatorId: true,
        userId: true,
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
              select: {
                id: true,
                tagId: true,
                documentId: true,
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

// ─── GET APPROVED SUBMISSIONS (Dean Repository View) ─────────────────────────
// Returns exclusively APPROVED DocumentMappings for non-archived documents.

export async function getApprovedSubmissions() {
  try {
    await requireAdminOrDean()

    const mappings = await prisma.documentMapping.findMany({
      where: {
        status: "APPROVED",
        document: { isArchived: false },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        rating: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        documentId: true,
        indicatorId: true,
        userId: true,
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
              select: {
                id: true,
                tagId: true,
                documentId: true,
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
      return { error: "Admin or Dean access required." }
    }
    console.error("[getApprovedSubmissions]", error)
    return { error: "Failed to load approved submissions." }
  }
}

export type ApprovedSubmission = NonNullable<
  Extract<Awaited<ReturnType<typeof getApprovedSubmissions>>, { success: true }>["data"]
>[number]


// ─── REVIEW SUBMISSION (Admin only) ──────────────────────────────────────────

export async function markSubmissionUnderReview(mappingId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrDean()
    
    // First, fetch the current status
    const mapping = await prisma.documentMapping.findUnique({
      where: { id: mappingId },
      include: {
        document: { select: { title: true } },
        indicator: { select: { name: true } },
      }
    })

    if (!mapping) return { error: "Submission not found." }

    // Idempotency: only transition if it's strictly "SUBMITTED"
    if (mapping.status !== "SUBMITTED") {
      return { success: true }
    }

    await prisma.documentMapping.update({
      where: { id: mappingId },
      data: { status: "UNDER_REVIEW" }
    })

    // Concurrent audit and notification
    await Promise.allSettled([
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "REVIEW_STARTED",
          module: "REVIEW",
          targetId: mapping.id,
          details: {
            documentTitle: mapping.document.title,
            indicatorName: mapping.indicator.name
          }
        }
      }),
      prisma.notification.create({
        data: {
          userId: mapping.userId,
          message: `The Dean is currently reviewing your submission: "${mapping.document.title}".`,
          type: "REVIEW",
          link: `/faculty/submissions`
        }
      })
    ]).catch(console.error)

    revalidatePath("/admin/submissions")
    revalidatePath("/dean/submissions")
    revalidatePath("/faculty/submissions")
    revalidatePath("/admin/dashboard")
    revalidatePath("/dean/dashboard")
    revalidateTag("areas-hierarchy")
    revalidateTag("dashboard")

    return { success: true }

  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin/Dean access required." }
    }
    console.error("[markSubmissionUnderReview]", error)
    return { error: "Failed to mark submission as under review." }
  }
}

const reviewSubmissionSchema = z.object({
  mappingId: z.string().uuid("Invalid mapping ID"),
  status: z.enum(["APPROVED", "RETURNED"]),
  remarks: z.string().optional(),
})

export async function reviewSubmission(
  formData: z.infer<typeof reviewSubmissionSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrDean()
    const validated = reviewSubmissionSchema.parse(formData)

    if (validated.status === "RETURNED" && (!validated.remarks || validated.remarks.trim() === "")) {
      return { error: "Remarks are required when returning a submission." }
    }

    const mapping = await prisma.documentMapping.findUnique({
      where: { id: validated.mappingId },
      include: { 
        document: true, 
        user: { select: { id: true, name: true } },
        indicator: { select: { name: true } }
      }
    })

    if (!mapping) return { error: "Submission not found." }

    await prisma.$transaction(async (tx) => {
      // Update the mapping status and remarks
      await tx.documentMapping.update({
        where: { id: validated.mappingId },
        data: {
          status: validated.status,
          remarks: validated.remarks ?? null
        }
      })

      if (validated.status === "RETURNED" && mapping.document.fileUrl) {
        // Create version snapshot of what was just returned
        await tx.documentVersion.create({
          data: {
            documentId: mapping.documentId,
            fileUrl: mapping.document.fileUrl,
            fileName: mapping.document.fileName ?? "Unknown",
            fileSize: mapping.document.fileSize,
            version: mapping.document.version,
            remarks: validated.remarks
          }
        })
      }
    })

    // Audit log and notifications (concurrent, non-critical)
    await Promise.allSettled([
      prisma.auditLog.create({
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
      }),
      prisma.notification.create({
        data: {
          userId: mapping.user.id,
          message: validated.status === "RETURNED" 
            ? `Your document "${mapping.document.title}" was returned with remarks: "${validated.remarks}". Please upload a new version.`
            : `Your submission "${mapping.document.title}" for "${mapping.indicator.name}" has been ${validated.status.toLowerCase()}.`,
          type: "REVIEW",
          link: `/faculty/submissions`
        }
      })
    ]).catch(console.error)

    revalidatePath("/admin/submissions")
    revalidatePath("/dean/submissions")
    revalidatePath("/faculty/submissions")
    revalidatePath("/admin/dashboard")
    revalidatePath("/dean/dashboard")
    revalidateTag("areas-hierarchy")
    revalidateTag("dashboard")

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
