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
  /** Compliance % = (indicators with ≥1 APPROVED mapping) / totalIndicators × 100 */
  value: number
  /** Indicators that have at least one APPROVED or SUBMITTED mapping (faculty provided). */
  providedEvidences: number
  /** Total number of indicators in this area. */
  totalIndicators: number
}

export interface DashboardStats {
  /** Number of non-archived documents that have at least one APPROVED mapping. */
  totalDocuments: number
  pendingReviews: number
  activeFaculty: number
  /** Number of indicators that have at least one APPROVED mapping. */
  approvedMappings: number
  /** (approvedMappings / totalIndicators) × 100 */
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

// ─── getDashboardStats ────────────────────────────────────────────────────────

/**
 * Inner function: runs the actual Prisma queries.
 * Wrapped by unstable_cache below for server-side caching.
 *
 * FIX #1: totalDocuments now counts only non-archived documents that have
 *          at least one APPROVED mapping — truly "approved documents."
 * FIX #4: compliancePercent now uses indicator-level compliance
 *          (indicators with ≥1 APPROVED mapping / total indicators),
 *          not raw approved-mapping-count / total-indicator-count.
 */
const _fetchDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    const [
      totalDocuments,
      pendingReviews,
      activeFaculty,
      indicatorsWithApproval,
      totalIndicators,
    ] = await Promise.all([
      // Only count non-archived documents that have at least one APPROVED mapping
      prisma.document.count({
        where: {
          isArchived: false,
          mappings: { some: { status: "APPROVED" } },
        },
      }),
      prisma.documentMapping.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),
      prisma.user.count({
        where: { role: "FACULTY", isActive: true },
      }),
      // Indicator-level compliance: indicators that have ≥1 APPROVED mapping
      prisma.indicator.count({
        where: { mappings: { some: { status: "APPROVED" } } },
      }),
      prisma.indicator.count(),
    ])

    const compliancePercent =
      totalIndicators > 0
        ? Math.round((indicatorsWithApproval / totalIndicators) * 100)
        : 0

    return {
      totalDocuments,
      pendingReviews,
      activeFaculty,
      approvedMappings: indicatorsWithApproval,
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
 */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  await requireAdminOrDean()

  const mappings = await prisma.documentMapping.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
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
 * Compliance = (indicators with ≥1 APPROVED mapping) / totalIndicators × 100
 */
const _fetchComplianceData = unstable_cache(
  async (): Promise<AreaCompliance[]> => {
    // Fetch areas with their indicator IDs (lean — no mappings)
    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      select: {
        name: true,
        criteria: {
          select: {
            indicators: {
              select: { id: true },
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

    const approvedIndicatorIds = new Set(approvedGroups.map((g) => g.indicatorId))

    return areas.map((area) => {
      const allIndicatorIds = area.criteria.flatMap((c) =>
        c.indicators.map((i) => i.id)
      )
      const totalIndicators = allIndicatorIds.length
      const approvedIndicators = allIndicatorIds.filter((id) =>
        approvedIndicatorIds.has(id)
      ).length

      const value =
        totalIndicators > 0
          ? Math.round((approvedIndicators / totalIndicators) * 100)
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
 *
 * This enables the "1/12 evidences" display.
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
              select: { id: true },
            },
          },
        },
      },
    })

    // Single query: group by indicatorId for APPROVED mappings
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

    const approvedIndicatorIds = new Set(approvedGroups.map((g) => g.indicatorId))
    const providedIndicatorIds = new Set(providedGroups.map((g) => g.indicatorId))

    return areas.map((area) => {
      const allIndicatorIds = area.criteria.flatMap((c) =>
        c.indicators.map((i) => i.id)
      )
      const totalIndicators = allIndicatorIds.length
      const approvedIndicators = allIndicatorIds.filter((id) =>
        approvedIndicatorIds.has(id)
      ).length
      const providedEvidences = allIndicatorIds.filter((id) =>
        providedIndicatorIds.has(id)
      ).length

      const value =
        totalIndicators > 0
          ? Math.round((approvedIndicators / totalIndicators) * 100)
          : 0

      return { name: area.name, value, providedEvidences, totalIndicators }
    })
  },
  ["compliance-data-with-counts"],
  { revalidate: 60, tags: ["dashboard"] }
)

export async function getComplianceDataWithCounts(): Promise<AreaComplianceWithCounts[]> {
  await requireAdminOrDean()
  return _fetchComplianceDataWithCounts()
}
