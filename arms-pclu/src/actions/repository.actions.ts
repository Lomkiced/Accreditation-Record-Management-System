"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/getUser"

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
    where: { status: "APPROVED" },
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
