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

export async function globalSearch(query: string, areaId?: string): Promise<GlobalSearchResponse> {
  const user = await getCurrentUser()
  if (!user) return { documents: [], faculties: [] }

  const trimmed = query.trim()
  if (!trimmed) return { documents: [], faculties: [] }

  const [documents, faculties] = await Promise.all([
    searchDocuments(trimmed, areaId),
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
      take: 10,
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
