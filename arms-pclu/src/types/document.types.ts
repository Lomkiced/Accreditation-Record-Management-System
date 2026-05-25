import type { MappingStatus } from "@prisma/client"
export type { MappingStatus }

// ─── Rich nested types returned from Prisma queries ──────────────────────────

/** A single DocumentMapping with its parent indicator (and criterion/area chain) */
export type MappingWithIndicator = {
  id: string
  documentId: string
  indicatorId: string
  userId: string
  status: MappingStatus
  remarks: string | null
  rating: number | null
  createdAt: Date
  updatedAt: Date
  indicator: {
    id: string
    name: string
    requiredDocs: string | null
    ratingScale: number
    order: number
    criterion: {
      id: string
      name: string
      order: number
      area: {
        id: string
        name: string
        order: number
      }
    }
  }
}

/** Central Document with all its mappings and tags */
export type DocumentWithMappings = {
  id: string
  userId: string
  title: string
  description: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  documentDate: Date | null
  version: number
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    department: string
  }
  mappings: MappingWithIndicator[]
  tags: {
    id: string
    tag: {
      id: string
      name: string
      color: string
    }
  }[]
  versions: {
    id: string
    version: number
    fileUrl: string
    fileName: string
    fileSize: number | null
    remarks: string | null
    createdAt: Date
  }[]
}

/** Indicator with its document mappings — used inside hierarchical drill-down */
export type IndicatorWithMappings = {
  id: string
  name: string
  requiredDocs: string | null
  ratingScale: number
  order: number
  mappings: {
    id: string
    status: MappingStatus
    rating: number | null
    document: {
      id: string
      title: string
      fileName: string | null
      fileUrl: string | null
      createdAt: Date
      user: { name: string }
    }
  }[]
}

/** Criterion with its indicators (and their mappings) — drill-down level 2 */
export type CriterionWithIndicators = {
  id: string
  name: string
  description: string | null
  order: number
  indicators: IndicatorWithMappings[]
}

/** Top-level Area with full hierarchy for the drill-down dashboard */
export type AreaWithHierarchy = {
  id: string
  name: string
  description: string | null
  order: number
  criteria: CriterionWithIndicators[]
}

/** Summary stats per area for dashboard */
export type AreaComplianceSummary = {
  areaId: string
  areaName: string
  totalIndicators: number
  approvedCount: number
  submittedCount: number
  draftCount: number
  compliancePercent: number
}
