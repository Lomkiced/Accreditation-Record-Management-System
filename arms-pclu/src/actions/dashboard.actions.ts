"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminOrDean } from "@/lib/auth/getUser"
import { unstable_cache } from "next/cache"

// ─── Return Types ─────────────────────────────────────────────────────────────

export interface AreaCompliance {
  name: string
  value: number
}

/** Richer compliance shape used by the Dean's ProgressByArea component. */
export interface AreaComplianceWithCounts {
  name: string
  /** Compliance % = (approved documents × 100) / total required documents */
  value: number
  /** Indicators that have at least one APPROVED or SUBMITTED mapping (faculty provided). */
  providedEvidences: number
  /** Total number of indicators in this area. */
  totalIndicators: number
  /** Total number of required documents across all indicators in this area. */
  totalRequiredDocs: number
  /** Number of approved documents (capped per indicator by requiredDocs). */
  approvedDocs: number
}

export interface DashboardStats {
  /** Number of non-archived documents that have at least one APPROVED mapping. */
  totalDocuments: number
  pendingReviews: number
  activeFaculty: number
  /** Number of approved documents (capped per indicator by requiredDocs). */
  approvedMappings: number
  /** (approved documents × 100) / total required documents */
  compliancePercent: number
}

export interface PendingSubmission {
  id: string
  status: string
  createdAt: Date
  document: {
    id: string
    title: string
    fileName: string | null
  }
  user: {
    id: string
    name: string
    department: string
  }
  indicator: {
    id: string
    name: string
    criterion: {
      id: string
      name: string
      area: {
        id: string
        name: string
      }
    }
  }
}

export interface RecentAuditLog {
  id: string
  action: string
  module: string
  createdAt: Date
  user: {
    name: string
    role: string
  }
  details: Record<string, unknown> | null
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Parses the `requiredDocs` field into a numeric count (minimum 1). */
function parseRequiredDocsCount(requiredDocs: string | null | undefined): number {
  if (!requiredDocs) return 1
  if (!isNaN(Number(requiredDocs))) return Math.max(1, Number(requiredDocs))
  return requiredDocs.split(",").filter((s: string) => s.trim().length > 0).length || 1
}

// ─── getDashboardStats ────────────────────────────────────────────────────────

/**
 * Inner function: runs the actual Prisma queries.
 * Wrapped by unstable_cache below for server-side caching.
 *
 * FIX #1 (pendingReviews): Now filters out mappings whose parent document is
 *         archived (`isArchived: true`) so the count matches the submissions page.
 * FIX #2 (compliancePercent): Uses document-level compliance:
 *         (approved documents × 100) / total required documents.
 */
const _fetchDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    const [
      totalDocuments,
      pendingReviews,
      activeFaculty,
      indicators,
    ] = await Promise.all([
      // Only count non-archived documents that have at least one APPROVED mapping
      prisma.document.count({
        where: {
          isArchived: false,
          mappings: { some: { status: "APPROVED" } },
        },
      }),
      // FIX #1: Only count pending mappings for NON-archived documents
      prisma.documentMapping.count({
        where: {
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
          document: { isArchived: false },
        },
      }),
      prisma.user.count({
        where: { role: "FACULTY", isActive: true },
      }),
      // Fetch all indicators with their requiredDocs and approved mapping counts
      prisma.indicator.findMany({
        select: {
          id: true,
          requiredDocs: true,
          _count: {
            select: {
              mappings: { where: { status: "APPROVED" } },
            },
          },
        },
      }),
    ])

    // Indicator-level compliance: fully provided indicators × 100 / total indicators
    let fullyApprovedIndicators = 0
    const totalIndicators = indicators.length

    indicators.forEach((ind) => {
      const reqCount = parseRequiredDocsCount(ind.requiredDocs)
      if (ind._count.mappings >= reqCount) {
        fullyApprovedIndicators += 1
      }
    })

    const compliancePercent =
      totalIndicators > 0
        ? Math.round((fullyApprovedIndicators * 100) / totalIndicators)
        : 0

    return {
      totalDocuments,
      pendingReviews,
      activeFaculty,
      approvedMappings: fullyApprovedIndicators,
      compliancePercent,
    }
  },
  ["dashboard-stats"],
  { revalidate: 60, tags: ["dashboard"] }
)

/**
 * Fetches aggregated statistics for the admin/dean dashboard.
 * Auth-gated, then delegates to a cached inner function.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdminOrDean()
  return _fetchDashboardStats()
}

// ─── getPendingSubmissions ────────────────────────────────────────────────────

/**
 * Fetches the latest 5 document mappings requiring admin evaluation.
 * Returns a flat, denormalized shape optimized for the dashboard table.
 * Excludes mappings whose parent document is archived.
 */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  await requireAdminOrDean()

  const mappings = await prisma.documentMapping.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      document: { isArchived: false },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      createdAt: true,
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
      indicator: {
        select: {
          id: true,
          name: true,
          criterion: {
            select: {
              id: true,
              name: true,
              area: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return mappings
}

// ─── getRecentAuditLogs ───────────────────────────────────────────────────────

/**
 * Fetches the latest 5 audit log entries for the Recent Activity panel.
 */
export async function getRecentAuditLogs(): Promise<RecentAuditLog[]> {
  await requireAdminOrDean()

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      action: true,
      module: true,
      createdAt: true,
      details: true,
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  })

  return logs.map((log) => ({
    ...log,
    details: (log.details as Record<string, unknown> | null) ?? null,
  }))
}

// ─── getComplianceData ────────────────────────────────────────────────────────

/**
 * Inner function: efficient DB-side aggregation for compliance percentages.
 * Wrapped by unstable_cache for server-side caching.
 *
 * Compliance = (approved documents × 100) / total required documents
 */
const _fetchComplianceData = unstable_cache(
  async (): Promise<AreaCompliance[]> => {
    // Fetch areas with their indicators including requiredDocs
    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      select: {
        name: true,
        criteria: {
          select: {
            indicators: {
              select: {
                id: true,
                requiredDocs: true,
              },
            },
          },
        },
      },
    })

    // Aggregate all approved mappings per indicator in ONE query
    const approvedGroups = await prisma.documentMapping.groupBy({
      by: ["indicatorId"],
      where: { status: "APPROVED" },
      _count: { _all: true },
    })

    const approvedCountMap = new Map(approvedGroups.map((g) => [g.indicatorId, g._count._all]))

    return areas.map((area) => {
      let fullyApprovedIndicators = 0
      let totalIndicators = 0

      area.criteria.forEach((c) => {
        c.indicators.forEach((ind) => {
          totalIndicators += 1
          const reqCount = parseRequiredDocsCount(ind.requiredDocs)
          const approvedMappings = approvedCountMap.get(ind.id) ?? 0
          if (approvedMappings >= reqCount) {
            fullyApprovedIndicators += 1
          }
        })
      })

      const value =
        totalIndicators > 0
          ? Math.round((fullyApprovedIndicators * 100) / totalIndicators)
          : 0

      return { name: area.name, value }
    })
  },
  ["compliance-data"],
  { revalidate: 60, tags: ["dashboard"] }
)

/**
 * Fetches compliance percentage per Area.
 * Auth-gated, then delegates to a cached inner function.
 */
export async function getComplianceData(): Promise<AreaCompliance[]> {
  await requireAdminOrDean()
  return _fetchComplianceData()
}

// ─── getComplianceDataWithCounts ──────────────────────────────────────────────

/**
 * Richer compliance data for the Dean's Progress by Area component.
 * Returns per-area compliance %, plus evidence counts:
 *   - providedEvidences: indicators with ≥1 APPROVED or SUBMITTED mapping
 *     (i.e., faculty has provided evidence, whether approved yet or not)
 *   - totalIndicators: total indicator count for that area
 *   - totalRequiredDocs: sum of requiredDocs across all indicators in the area
 *   - approvedDocs: count of approved mappings (capped per indicator)
 *
 * Compliance % = (approved documents × 100) / total required documents
 */
const _fetchComplianceDataWithCounts = unstable_cache(
  async (): Promise<AreaComplianceWithCounts[]> => {
    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      select: {
        name: true,
        criteria: {
          select: {
            indicators: {
              select: {
                id: true,
                requiredDocs: true,
              },
            },
          },
        },
      },
    })

    // Single query: group by indicatorId for APPROVED mappings (with counts)
    const approvedGroups = await prisma.documentMapping.groupBy({
      by: ["indicatorId"],
      where: { status: "APPROVED" },
      _count: { _all: true },
    })

    // Single query: group by indicatorId for APPROVED or SUBMITTED (provided) mappings
    const providedGroups = await prisma.documentMapping.groupBy({
      by: ["indicatorId"],
      where: { status: { in: ["APPROVED", "SUBMITTED", "UNDER_REVIEW"] } },
      _count: { _all: true },
    })

    const approvedCountMap = new Map(approvedGroups.map((g) => [g.indicatorId, g._count._all]))
    const providedIndicatorIds = new Set(providedGroups.map((g) => g.indicatorId))

    return areas.map((area) => {
      const allIndicatorIds = area.criteria.flatMap((c) =>
        c.indicators.map((i) => i.id)
      )
      const totalIndicators = allIndicatorIds.length

      let totalRequiredDocs = 0
      let approvedDocCount = 0
      let fullyApprovedIndicators = 0

      area.criteria.forEach((c) => {
        c.indicators.forEach((ind) => {
          const reqCount = parseRequiredDocsCount(ind.requiredDocs)
          totalRequiredDocs += reqCount
          const approvedMappings = approvedCountMap.get(ind.id) ?? 0
          approvedDocCount += Math.min(approvedMappings, reqCount)
          if (approvedMappings >= reqCount) {
            fullyApprovedIndicators += 1
          }
        })
      })

      const providedEvidences = allIndicatorIds.filter((id) =>
        providedIndicatorIds.has(id)
      ).length

      const value =
        totalIndicators > 0
          ? Math.round((fullyApprovedIndicators * 100) / totalIndicators)
          : 0

      return {
        name: area.name,
        value,
        providedEvidences,
        totalIndicators,
        totalRequiredDocs,
        approvedDocs: approvedDocCount,
      }
    })
  },
  ["compliance-data-with-counts"],
  { revalidate: 60, tags: ["dashboard"] }
)

export async function getComplianceDataWithCounts(): Promise<AreaComplianceWithCounts[]> {
  await requireAdminOrDean()
  return _fetchComplianceDataWithCounts()
}
