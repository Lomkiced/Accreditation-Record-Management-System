"use server"

import { prisma } from "@/lib/prisma"
import { requireUser, requireAdmin } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  uploadDocumentSchema,
  createMappingsSchema,
  reviewMappingSchema,
} from "@/lib/validations/document.schema"
import { sanitizeString } from "@/lib/sanitize"
import type {
  DocumentWithMappings,
  AreaWithHierarchy,
  AreaComplianceSummary,
} from "@/types/document.types"

// ─── Shared result type ───────────────────────────────────────────────────────
type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD DOCUMENT — Create a central Document record
// Called after the client has uploaded the file to Supabase Storage.
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadDocument(
  formData: z.infer<typeof uploadDocumentSchema>
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const currentUser = await requireUser()

    const validated = uploadDocumentSchema.parse({
      ...formData,
      title: sanitizeString(formData.title),
      description: formData.description
        ? sanitizeString(formData.description)
        : undefined,
    })

    const document = await prisma.document.create({
      data: {
        userId: currentUser.id,
        title: validated.title,
        description: validated.description ?? null,
        documentDate: validated.documentDate
          ? new Date(validated.documentDate)
          : null,
        fileUrl: validated.fileUrl ?? null,
        fileName: validated.fileName ?? null,
        fileSize: validated.fileSize ?? null,
        version: 1,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "UPLOAD_DOCUMENT",
        module: "DOCUMENT",
        targetId: document.id,
        details: { title: document.title, fileName: document.fileName },
      },
    })

    revalidatePath("/admin/repository")
    revalidatePath("/faculty/submissions")

    return { success: true, data: { documentId: document.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "You must be logged in to upload documents." }
    }
    console.error("[uploadDocument]", error)
    return { error: "Failed to upload document. Please try again." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE EVIDENCE MAPPINGS — M:N linking of Document → Indicators
// Accepts a documentId and an array of indicatorIds.
// Idempotent: skips indicator IDs that already have a mapping for this document.
// ─────────────────────────────────────────────────────────────────────────────
export async function createEvidenceMappings(
  input: z.infer<typeof createMappingsSchema>
): Promise<ActionResult<{ createdCount: number; skippedCount: number }>> {
  try {
    const currentUser = await requireUser()

    const validated = createMappingsSchema.parse(input)

    // Verify document belongs to this user (or user is admin)
    const document = await prisma.document.findUnique({
      where: { id: validated.documentId },
      select: { id: true, userId: true, title: true },
    })

    if (!document) return { error: "Document not found." }

    if (
      document.userId !== currentUser.id &&
      currentUser.role !== "ADMIN"
    ) {
      return { error: "You do not have permission to map this document." }
    }

    // Verify all indicator IDs exist
    const existingIndicators = await prisma.indicator.findMany({
      where: { id: { in: validated.indicatorIds } },
      select: { id: true },
    })

    if (existingIndicators.length !== validated.indicatorIds.length) {
      return { error: "One or more selected indicators do not exist." }
    }

    // Find already-existing mappings (for idempotency)
    const existingMappings = await prisma.documentMapping.findMany({
      where: {
        documentId: validated.documentId,
        indicatorId: { in: validated.indicatorIds },
      },
      select: { indicatorId: true },
    })

    const existingIndicatorIds = new Set(
      existingMappings.map((m) => m.indicatorId)
    )

    const newIndicatorIds = validated.indicatorIds.filter(
      (id) => !existingIndicatorIds.has(id)
    )

    if (newIndicatorIds.length === 0) {
      return {
        success: true,
        data: { createdCount: 0, skippedCount: validated.indicatorIds.length },
      }
    }

    // Bulk create new mappings
    await prisma.documentMapping.createMany({
      data: newIndicatorIds.map((indicatorId) => ({
        documentId: validated.documentId,
        indicatorId,
        userId: currentUser.id,
        status: "DRAFT",
        rating: validated.rating ?? null,
      })),
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "CREATE_EVIDENCE_MAPPINGS",
        module: "DOCUMENT",
        targetId: validated.documentId,
        details: {
          documentTitle: document.title,
          indicatorIds: newIndicatorIds,
          createdCount: newIndicatorIds.length,
        },
      },
    })

    revalidatePath("/admin/repository")
    revalidatePath("/admin/dashboard")
    revalidatePath("/faculty/submissions")

    return {
      success: true,
      data: {
        createdCount: newIndicatorIds.length,
        skippedCount: existingIndicatorIds.size,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to perform this action." }
    }
    console.error("[createEvidenceMappings]", error)
    return { error: "Failed to create evidence mappings. Please try again." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT MAPPING — Transition a single mapping DRAFT → SUBMITTED
// ─────────────────────────────────────────────────────────────────────────────
export async function submitMapping(
  mappingId: string
): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const mapping = await prisma.documentMapping.findUnique({
      where: { id: mappingId },
      select: { id: true, userId: true, status: true, documentId: true },
    })

    if (!mapping) return { error: "Mapping not found." }
    if (mapping.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "You do not have permission to submit this mapping." }
    }
    if (mapping.status !== "DRAFT" && mapping.status !== "RETURNED") {
      return {
        error: `Cannot submit a mapping with status "${mapping.status}".`,
      }
    }

    await prisma.documentMapping.update({
      where: { id: mappingId },
      data: { status: "SUBMITTED" },
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "SUBMIT_MAPPING",
        module: "DOCUMENT",
        targetId: mappingId,
      },
    })

    revalidatePath("/admin/submissions")
    revalidatePath("/faculty/submissions")

    return { success: true }
  } catch (error) {
    console.error("[submitMapping]", error)
    return { error: "Failed to submit mapping." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT ALL MAPPINGS FOR A DOCUMENT — Batch-submit all DRAFT/RETURNED mappings
// ─────────────────────────────────────────────────────────────────────────────
export async function submitAllMappings(
  documentId: string
): Promise<ActionResult<{ submittedCount: number }>> {
  try {
    const currentUser = await requireUser()

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true, title: true },
    })

    if (!document) return { error: "Document not found." }
    if (document.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "You do not have permission to submit this document." }
    }

    const result = await prisma.documentMapping.updateMany({
      where: {
        documentId,
        status: { in: ["DRAFT", "RETURNED"] },
      },
      data: { status: "SUBMITTED" },
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "SUBMIT_ALL_MAPPINGS",
        module: "DOCUMENT",
        targetId: documentId,
        details: {
          documentTitle: document.title,
          submittedCount: result.count,
        },
      },
    })

    revalidatePath("/admin/submissions")
    revalidatePath("/faculty/submissions")

    return { success: true, data: { submittedCount: result.count } }
  } catch (error) {
    console.error("[submitAllMappings]", error)
    return { error: "Failed to submit document for review." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW MAPPING — Admin only. Change status + add remarks per mapping.
// ─────────────────────────────────────────────────────────────────────────────
export async function reviewMapping(
  input: z.infer<typeof reviewMappingSchema>
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const validated = reviewMappingSchema.parse(input)

    const mapping = await prisma.documentMapping.findUnique({
      where: { id: validated.mappingId },
      include: {
        document: { select: { title: true } },
        indicator: { select: { name: true } },
      },
    })

    if (!mapping) return { error: "Mapping not found." }

    await prisma.documentMapping.update({
      where: { id: validated.mappingId },
      data: {
        status: validated.status,
        remarks: validated.remarks ?? null,
      },
    })

    // Notify the faculty member
    await prisma.notification.create({
      data: {
        userId: mapping.userId,
        message: `Your document "${mapping.document.title}" mapped to "${mapping.indicator.name}" has been ${validated.status.toLowerCase().replace("_", " ")}.`,
        type: "MAPPING_REVIEW",
        link: `/faculty/submissions`,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "REVIEW_MAPPING",
        module: "DOCUMENT",
        targetId: validated.mappingId,
        details: {
          newStatus: validated.status,
          remarks: validated.remarks,
          documentTitle: mapping.document.title,
          indicatorName: mapping.indicator.name,
        },
      },
    })

    revalidatePath("/admin/submissions")
    revalidatePath("/admin/dashboard")
    revalidatePath("/faculty/submissions")

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return { error: "Admin access required." }
    }
    console.error("[reviewMapping]", error)
    return { error: "Failed to update mapping status." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MAPPING — Remove a single mapping without touching the Document.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteMapping(mappingId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const mapping = await prisma.documentMapping.findUnique({
      where: { id: mappingId },
      select: { id: true, userId: true, status: true },
    })

    if (!mapping) return { error: "Mapping not found." }

    // Only the owner or an admin can delete; approved mappings are locked
    if (mapping.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "You do not have permission to delete this mapping." }
    }
    if (mapping.status === "APPROVED" && currentUser.role !== "ADMIN") {
      return { error: "Approved mappings cannot be removed by faculty." }
    }

    await prisma.documentMapping.delete({ where: { id: mappingId } })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "DELETE_MAPPING",
        module: "DOCUMENT",
        targetId: mappingId,
      },
    })

    revalidatePath("/admin/repository")
    revalidatePath("/faculty/submissions")

    return { success: true }
  } catch (error) {
    console.error("[deleteMapping]", error)
    return { error: "Failed to delete mapping." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET AREAS WITH FULL HIERARCHY — For the hierarchical drill-down dashboard.
// Returns: Area → Criteria → Indicators → Mappings → Document
// ─────────────────────────────────────────────────────────────────────────────
export async function getAreasWithHierarchy(): Promise<
  ActionResult<AreaWithHierarchy[]>
> {
  try {
    await requireUser()

    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      include: {
        criteria: {
          orderBy: { order: "asc" },
          include: {
            indicators: {
              orderBy: { order: "asc" },
              include: {
                mappings: {
                  include: {
                    document: {
                      select: {
                        id: true,
                        title: true,
                        fileName: true,
                        fileUrl: true,
                        createdAt: true,
                        user: { select: { name: true } },
                      },
                    },
                  },
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
      },
    })

    return { success: true, data: areas as AreaWithHierarchy[] }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getAreasWithHierarchy]", error)
    return { error: "Failed to load area hierarchy." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET DOCUMENTS FOR REPOSITORY — All documents with their mappings.
// ─────────────────────────────────────────────────────────────────────────────
export async function getDocumentsForRepository(opts?: {
  userId?: string
}): Promise<ActionResult<DocumentWithMappings[]>> {
  try {
    const currentUser = await requireUser()

    // Faculty can only see their own documents
    const whereClause =
      currentUser.role === "FACULTY"
        ? { userId: currentUser.id }
        : opts?.userId
          ? { userId: opts.userId }
          : {}

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
        mappings: {
          include: {
            indicator: {
              select: {
                id: true,
                name: true,
                requiredDocs: true,
                ratingScale: true,
                order: true,
                criterion: {
                  select: {
                    id: true,
                    name: true,
                    order: true,
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
          include: {
            tag: { select: { id: true, name: true, color: true } },
          },
        },
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
      },
    })

    return { success: true, data: documents as DocumentWithMappings[] }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { error: "Authentication required." }
    }
    console.error("[getDocumentsForRepository]", error)
    return { error: "Failed to load documents." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET AREA COMPLIANCE SUMMARIES — Aggregated stats per area for dashboard.
// ─────────────────────────────────────────────────────────────────────────────
export async function getAreaComplianceSummaries(): Promise<
  ActionResult<AreaComplianceSummary[]>
> {
  try {
    await requireUser()

    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      include: {
        criteria: {
          include: {
            indicators: {
              include: {
                mappings: {
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    })

    const summaries: AreaComplianceSummary[] = areas.map((area) => {
      const allMappings = area.criteria.flatMap((c) =>
        c.indicators.flatMap((i) => i.mappings)
      )
      const totalIndicators = area.criteria.flatMap((c) => c.indicators).length
      const approvedCount = allMappings.filter(
        (m) => m.status === "APPROVED"
      ).length
      const submittedCount = allMappings.filter(
        (m) => m.status === "SUBMITTED" || m.status === "UNDER_REVIEW"
      ).length
      const draftCount = allMappings.filter(
        (m) => m.status === "DRAFT"
      ).length

      return {
        areaId: area.id,
        areaName: area.name,
        totalIndicators,
        approvedCount,
        submittedCount,
        draftCount,
        compliancePercent:
          totalIndicators > 0
            ? Math.round((approvedCount / totalIndicators) * 100)
            : 0,
      }
    })

    return { success: true, data: summaries }
  } catch (error) {
    console.error("[getAreaComplianceSummaries]", error)
    return { error: "Failed to load compliance summaries." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET INDICATORS FOR AREA SELECTOR — Lightweight fetch for the tagging UI.
// Returns Area → Criteria → Indicators (no mappings or documents).
// ─────────────────────────────────────────────────────────────────────────────
export async function getIndicatorsForSelector(): Promise<
  ActionResult<
    {
      id: string
      name: string
      order: number
      criteria: {
        id: string
        name: string
        order: number
        indicators: {
          id: string
          name: string
          requiredDocs: string | null
          order: number
        }[]
      }[]
    }[]
  >
> {
  try {
    const currentUser = await requireUser()

    // Base query constraints
    let areaWhereClause: any = {}

    // If the user is FACULTY, enforce strictly scoped Area assignments
    if (currentUser.role === "FACULTY") {
      const assignments = await prisma.assignment.findMany({
        where: { userId: currentUser.id },
        select: { areaId: true, criterionId: true },
      })
      
      const assignedAreaIds = Array.from(new Set(assignments.map(a => a.areaId)))
      
      // If no assignments, they shouldn't be able to tag anything
      if (assignedAreaIds.length === 0) {
        return { success: true, data: [] }
      }

      areaWhereClause = { id: { in: assignedAreaIds } }
    }

    const areas = await prisma.area.findMany({
      where: areaWhereClause,
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        order: true,
        criteria: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            order: true,
            indicators: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                name: true,
                requiredDocs: true,
                order: true,
              },
            },
          },
        },
      },
    })

    // If FACULTY, further filter criteria based on specific criterion assignments
    let filteredAreas = areas
    if (currentUser.role === "FACULTY") {
      const assignments = await prisma.assignment.findMany({
        where: { userId: currentUser.id },
        select: { areaId: true, criterionId: true },
      })

      filteredAreas = areas.map(area => {
        // Find assignments for this specific area
        const areaAssignments = assignments.filter(a => a.areaId === area.id)
        
        // If there is ANY assignment for this area that has criterionId === null, 
        // it means they are assigned to the ENTIRE area. They get all criteria.
        const hasFullAreaAccess = areaAssignments.some(a => a.criterionId === null)
        
        if (hasFullAreaAccess) {
          return area
        }

        // Otherwise, they only get the explicitly assigned criteria
        const assignedCriterionIds = new Set(areaAssignments.map(a => a.criterionId).filter(Boolean))
        
        return {
          ...area,
          criteria: area.criteria.filter(crit => assignedCriterionIds.has(crit.id))
        }
      }).filter(area => area.criteria.length > 0)
    }

    return { success: true, data: filteredAreas }
  } catch (error) {
    console.error("[getIndicatorsForSelector]", error)
    return { error: "Failed to load indicators." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE DOCUMENT — Remove a central Document record (cascades to mappings)
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireUser()

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true, title: true },
    })

    if (!document) return { error: "Document not found." }

    // Only the owner or an admin can delete
    if (document.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { error: "You do not have permission to delete this document." }
    }

    await prisma.document.delete({ where: { id: documentId } })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "DELETE_DOCUMENT",
        module: "DOCUMENT",
        targetId: documentId,
        details: { title: document.title },
      },
    })

    revalidatePath("/admin/repository")
    revalidatePath("/faculty/submissions")

    return { success: true }
  } catch (error) {
    console.error("[deleteDocument]", error)
    return { error: "Failed to delete document." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAGS — Get all system tags and toggle tags on documents
// ─────────────────────────────────────────────────────────────────────────────
export async function getAllTags(): Promise<ActionResult<{ id: string; name: string; color: string }[]>> {
  try {
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" }
    })
    
    // Auto-seed if empty for the first time
    if (tags.length === 0) {
      const defaultTags = [
        { name: "Priority",  color: "#EF4444" },
        { name: "For Review",color: "#F59E0B" },
        { name: "Finalized", color: "#10B981" },
        { name: "Archived",  color: "#64748B" },
      ]
      await prisma.tag.createMany({ data: defaultTags })
      const newTags = await prisma.tag.findMany({ select: { id: true, name: true, color: true }, orderBy: { name: "asc" } })
      return { success: true, data: newTags }
    }
    
    return { success: true, data: tags }
  } catch (error) {
    console.error("[getAllTags]", error)
    return { error: "Failed to load tags." }
  }
}

export async function toggleDocumentTag(documentId: string, tagId: string, add: boolean): Promise<ActionResult> {
  try {
    await requireUser()
    
    if (add) {
      // Use create instead of upsert to avoid complexity, handle unique constraint if already exists
      try {
        await prisma.documentTag.create({
          data: { documentId, tagId },
        })
      } catch (e: any) {
        if (e.code !== 'P2002') throw e // ignore unique constraint violation
      }
    } else {
      await prisma.documentTag.deleteMany({
        where: { documentId, tagId },
      })
    }
    
    revalidatePath("/admin/repository")
    return { success: true }
  } catch (error) {
    console.error("[toggleDocumentTag]", error)
    return { error: "Failed to toggle tag." }
  }
}
