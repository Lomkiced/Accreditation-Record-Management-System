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

export interface FacultySearchResult {
  id: string
  name: string
  email: string
  department: string
  designation: string
  assignedAreasCount: number
}

export interface GlobalSearchResponse {
  documents: SearchResult[]
  faculties: FacultySearchResult[]
}

export async function searchDocuments(
  query: string,
  areaId?: string,
  currentUser?: any
): Promise<SearchResult[]> {
  const user = currentUser ?? (await getCurrentUser())
  if (!user) return []

  const trimmed = query.trim()
  const whereClause: any = { isArchived: false }

  if (trimmed) {
    whereClause.OR = [
      { title: { contains: trimmed, mode: "insensitive" } },
      { fileName: { contains: trimmed, mode: "insensitive" } },
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
    take: 12,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileUrl: true,
      createdAt: true,
      user: { select: { name: true } },
      mappings: {
        where: mappingFilter,
        take: 3,
        select: {
          id: true,
          status: true,
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

export async function globalSearch(query: string, areaId?: string): Promise<GlobalSearchResponse> {
  const trimmed = query?.trim() ?? ""
  if (!trimmed) return { documents: [], faculties: [] }

  const user = await getCurrentUser()
  if (!user) return { documents: [], faculties: [] }

  const [documents, faculties] = await Promise.all([
    searchDocuments(trimmed, areaId, user),
    prisma.user.findMany({
      where: {
        role: "FACULTY",
        isActive: true,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
          { department: { contains: trimmed, mode: "insensitive" } },
          { designation: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 6,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        designation: true,
        _count: {
          select: { assignments: true },
        },
      },
    }),
  ])

  return {
    documents,
    faculties: faculties.map((f) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      department: f.department,
      designation: f.designation,
      assignedAreasCount: f._count.assignments,
    })),
  }
}
