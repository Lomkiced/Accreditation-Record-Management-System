"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminOrDean } from "@/lib/auth/getUser"
import { unstable_cache } from "next/cache"

// ─── Return Types ─────────────────────────────────────────────────────────────

export interface AreaCompliance {
  name: string
  value: number
}

export interface DashboardStats {
  totalDocuments: number
  pendingReviews: number
  activeFaculty: number
  approvedMappings: number
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
 * Fetches aggregated statistics for the admin dashboard.
 * Runs 4 parallel Prisma queries for performance.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdminOrDean()

  const [
    totalDocuments,
    pendingReviews,
    activeFaculty,
    approvedMappings,
    totalMappingsWithIndicators,
  ] = await Promise.all([
    // Total uploaded documents in the central repository
    prisma.document.count(),

    // Mappings awaiting admin review
    prisma.documentMapping.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),

    // Active faculty accounts (excluding admins)
    prisma.user.count({
      where: { role: "FACULTY", isActive: true },
    }),

    // Fully approved mappings (at least 1 approved mapping per indicator)
    prisma.documentMapping.count({
      where: { status: "APPROVED" },
    }),

    // Total indicator count for compliance percentage calculation
    prisma.indicator.count(),
  ])

  const compliancePercent =
    totalMappingsWithIndicators > 0
      ? Math.round((approvedMappings / totalMappingsWithIndicators) * 100)
      : 0

  return {
    totalDocuments,
    pendingReviews,
    activeFaculty,
    approvedMappings,
    compliancePercent,
  }
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
 * Fetches compliance percentage per Area using an efficient DB-side aggregation.
 * Instead of pulling all indicators + mappings into memory, this does one
 * prisma.$queryRaw (or groupBy) pass to compute approved counts per area.
 */
export async function getComplianceData(): Promise<AreaCompliance[]> {
  await requireAdminOrDean()

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
}
