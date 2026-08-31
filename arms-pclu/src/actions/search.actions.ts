"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getUser"

export interface SearchResult {
  id: string
  title: string
  fileName: string | null
  fileUrl: string | null
  createdAt: Date
  facultyName: string
  status: string
  areaName: string
}

export async function searchDocuments(query: string, areaId?: string): Promise<SearchResult[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const isFaculty = user.role === "FACULTY"

  const whereClause: any = { isArchived: false }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { fileName: { contains: query, mode: "insensitive" } },
    ]
  }

  const mappingFilter: any = (areaId && areaId !== "all") ? {
    indicator: {
      criterion: {
        areaId: areaId
      }
    }
  } : undefined

  if (mappingFilter) {
    whereClause.mappings = {
      some: mappingFilter
    }
  }

  const docs = await prisma.document.findMany({
    where: whereClause,
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      mappings: {
        where: mappingFilter,
        include: {
          indicator: {
            select: {
              criterion: {
                select: {
                  area: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  return docs.map(doc => {
    let status = "UNMAPPED"
    let areaName = "Not Mapped"
    
    if (doc.mappings && doc.mappings.length > 0) {
      const m = doc.mappings[0]
      status = m.status
      areaName = m.indicator.criterion.area.name
      
      if (doc.mappings.length > 1) {
         areaName = `${areaName} (+${doc.mappings.length - 1} more)`
         const allSameStatus = doc.mappings.every(map => map.status === m.status)
         if (!allSameStatus) {
            status = "VARIES"
         }
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      createdAt: doc.createdAt,
      facultyName: doc.user.name,
      status: status,
      areaName: areaName,
    }
  })
}
