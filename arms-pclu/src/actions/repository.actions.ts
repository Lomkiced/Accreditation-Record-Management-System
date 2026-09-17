"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin, requireAdminOrDean } from "@/lib/auth/getUser"
import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

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

function extractStoragePath(fileUrl: string, bucket = "documents"): string | null {
  try {
    const url = new URL(fileUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx !== -1) {
      return decodeURIComponent(url.pathname.substring(idx + marker.length))
    }
    const altMarker = `/${bucket}/`
    const altIdx = url.pathname.indexOf(altMarker)
    if (altIdx !== -1) {
      return decodeURIComponent(url.pathname.substring(altIdx + altMarker.length))
    }
    return null
  } catch {
    const clean = fileUrl.split("?")[0]
    const marker = `/${bucket}/`
    const idx = clean.indexOf(marker)
    if (idx !== -1) {
      return decodeURIComponent(clean.substring(idx + marker.length))
    }
    const bucketPrefix = `${bucket}/`
    if (clean.startsWith(bucketPrefix)) {
      return decodeURIComponent(clean.substring(bucketPrefix.length))
    }
    return clean || null
  }
}

export async function permanentlyDeleteDocumentFromRepository(
  documentId: string
): Promise<ActionResult> {
  try {
    const currentUser = await requireAdminOrDean()

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          select: { fileUrl: true },
        },
      },
    })
    if (!doc) return { error: "Document not found." }

    // 1. Clean up physical files from Supabase Storage
    try {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "documents"
      const adminSupabase = createAdminClient()

      const fileUrlsToDelete: string[] = []
      if (doc.fileUrl) fileUrlsToDelete.push(doc.fileUrl)
      doc.versions.forEach((v) => {
        if (v.fileUrl && !fileUrlsToDelete.includes(v.fileUrl)) {
          fileUrlsToDelete.push(v.fileUrl)
        }
      })

      const storagePaths: string[] = []
      for (const url of fileUrlsToDelete) {
        const path = extractStoragePath(url, bucket)
        if (path && !storagePaths.includes(path)) {
          storagePaths.push(path)
        }
      }

      if (storagePaths.length > 0) {
        const { error: storageError } = await adminSupabase.storage
          .from(bucket)
          .remove(storagePaths)
        if (storageError) {
          console.warn(
            "[permanentlyDeleteDocumentFromRepository] Storage removal warning:",
            storageError.message
          )
        }
      }
    } catch (storageErr) {
      console.error(
        "[permanentlyDeleteDocumentFromRepository] Storage cleanup error (proceeding with DB deletion):",
        storageErr
      )
    }

    // 2. Cascade delete from Prisma (cascades to mappings, versions, tags)
    await prisma.document.delete({
      where: { id: documentId },
    })

    // 3. Log audit event
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "PERMANENT_DELETE_DOCUMENT",
        module: "REPOSITORY",
        targetId: documentId,
        details: {
          title: doc.title,
          fileName: doc.fileName,
          facultyId: doc.userId,
          reason: "Permanently deleted from repository archives by Dean/Admin",
        },
      },
    })

    // 4. Revalidate all related portal paths and tags
    revalidatePath("/dean/repository")
    revalidatePath("/admin/repository")
    revalidatePath("/faculty/submissions")
    revalidatePath("/faculty/archives")
    revalidatePath("/faculty/my-areas")
    revalidatePath("/dean/dashboard")
    revalidatePath("/admin/dashboard")
    revalidatePath("/faculty/dashboard")
    revalidatePath("/dean/areas")
    revalidatePath("/admin/areas")
    revalidateTag("dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("[permanentlyDeleteDocumentFromRepository]", error)
    return {
      error:
        error.message ||
        "Failed to permanently delete document from repository.",
    }
  }
}

