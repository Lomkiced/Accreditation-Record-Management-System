"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin, requireAdminOrDean } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

export interface ApprovedDocument {
  id: string
  title: string
  fileName: string | null
  fileUrl: string | null
  facultyName: string
  uploadedAt: Date
  indicators: {
    name: string
    criterionName: string
  }[]
}

export interface AreaWithApprovedDocuments {
  id: string
  name: string
  documents: ApprovedDocument[]
}

export async function getApprovedDocumentsByArea(): Promise<AreaWithApprovedDocuments[]> {
  await requireAdmin()

  // Fetch all areas, ordered
  const areas = await prisma.area.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
    }
  })

  // Fetch all APPROVED document mappings with their related data
  const approvedMappings = await prisma.documentMapping.findMany({
    where: {
      status: "APPROVED",
      document: { isArchivedFromRepo: false },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
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
      indicator: {
        select: {
          name: true,
          criterion: {
            select: { name: true, areaId: true },
          },
        },
      },
    },
  })

  // Group mappings by area, and then group by document within that area
  const result: AreaWithApprovedDocuments[] = areas.map(area => ({
    id: area.id,
    name: area.name,
    documents: []
  }))

  for (const area of result) {
    // Get all mappings for this area
    const areaMappings = approvedMappings.filter(m => m.indicator.criterion.areaId === area.id)
    
    // Group them by document
    const docMap = new Map<string, ApprovedDocument>()
    for (const mapping of areaMappings) {
      const doc = mapping.document
      if (!docMap.has(doc.id)) {
        docMap.set(doc.id, {
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          facultyName: doc.user.name,
          uploadedAt: doc.createdAt,
          indicators: []
        })
      }
      
      const entry = docMap.get(doc.id)!
      // Check if indicator already added to avoid duplicates if multiple mappings somehow exist
      if (!entry.indicators.some(i => i.name === mapping.indicator.name)) {
        entry.indicators.push({
          name: mapping.indicator.name,
          criterionName: mapping.indicator.criterion.name
        })
      }
    }
    
    // Convert to array and sort by upload date (newest first)
    area.documents = Array.from(docMap.values()).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  }

  return result
}

export async function archiveDocumentFromRepository(documentId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireAdminOrDean()

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })
    if (!doc) return { error: "Document not found." }

    await prisma.document.update({
      where: { id: documentId },
      data: { isArchivedFromRepo: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "ARCHIVE_FROM_REPOSITORY",
        module: "DOCUMENT",
        targetId: documentId,
        details: {
          title: doc.title,
          reason: "Archived from repository by Dean/Admin - preserved in faculty submissions",
        },
      },
    })

    revalidatePath("/dean/repository")
    revalidatePath("/admin/repository")
    revalidatePath("/faculty/submissions")

    return { success: true }
  } catch (error: any) {
    console.error("[archiveDocumentFromRepository]", error)
    return { error: "Failed to archive document from repository." }
  }
}

export async function restoreDocumentToRepository(documentId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireAdminOrDean()

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })
    if (!doc) return { error: "Document not found." }

    await prisma.document.update({
      where: { id: documentId },
      data: { isArchivedFromRepo: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "RESTORE_TO_REPOSITORY",
        module: "DOCUMENT",
        targetId: documentId,
        details: {
          title: doc.title,
          reason: "Restored to active repository by Dean/Admin",
        },
      },
    })

    revalidatePath("/dean/repository")
    revalidatePath("/admin/repository")

    return { success: true }
  } catch (error: any) {
    console.error("[restoreDocumentToRepository]", error)
    return { error: "Failed to restore document to repository." }
  }
}
