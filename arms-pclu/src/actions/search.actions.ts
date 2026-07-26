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

  // Base where clause for the mapping
  const whereClause: any = {}

  if (isFaculty) {
    whereClause.userId = user.id
  }

  if (areaId && areaId !== "all") {
    whereClause.indicator = {
      criterion: {
        areaId: areaId
      }
    }
  }

  if (query) {
    whereClause.document = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { fileName: { contains: query, mode: "insensitive" } },
      ]
    }
  }

  const mappings = await prisma.documentMapping.findMany({
    where: whereClause,
    include: {
      document: {
        include: {
          user: { select: { name: true } }
        }
      },
      indicator: {
        include: {
          criterion: {
            include: {
              area: { select: { name: true } }
            }
          }
        }
      }
    },
    take: 20, // Limit to 20 results for quick search
    orderBy: { createdAt: 'desc' }
  })

  // Map to distinct SearchResult
  const resultsMap = new Map<string, SearchResult>()
  
  for (const m of mappings) {
    if (!resultsMap.has(m.document.id)) {
      resultsMap.set(m.document.id, {
        id: m.document.id,
        title: m.document.title,
        fileName: m.document.fileName,
        fileUrl: m.document.fileUrl,
        createdAt: m.document.createdAt,
        facultyName: m.document.user.name,
        status: m.status,
        areaName: m.indicator.criterion.area.name
      })
    }
  }

  return Array.from(resultsMap.values())
}
