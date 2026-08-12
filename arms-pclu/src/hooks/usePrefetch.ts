"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

// ── Server Action imports for data prefetching ──
import { getAreas } from "@/actions/area.actions"
import {
  getDashboardStats,
  getPendingSubmissions,
  getRecentAuditLogs,
  getComplianceData,
} from "@/actions/dashboard.actions"
import { getAllSubmissions, getMySubmissions } from "@/actions/submission.actions"
import { getAuditLogs } from "@/actions/audit.actions"
import { getUsers } from "@/actions/user.actions"
import { getNotifications } from "@/actions/notification.actions"
import { getTagsWithUsage } from "@/actions/tag.actions"
import { getDocumentsForRepository } from "@/actions/document.actions"
import {
  getFacultyWithAssignmentCounts,
} from "@/actions/assignment.actions"

// ── Query keys (mirrored from their respective hooks) ──
import { areaKeys } from "./useAreas"
import { dashboardKeys } from "./useDashboard"
import { submissionKeys } from "./useSubmissions"
import { auditLogKeys } from "./useAuditLogs"
import { userKeys } from "./useUsers"
import { notificationKeys } from "./useNotifications"
import { tagKeys } from "./useTagManagement"
import { assignmentKeys } from "./useAssignments"

// ── Prefetch configuration per route ──
// Maps a sidebar href to one or more TanStack Query prefetch configs.
// When the user hovers a link, we fire router.prefetch() for the JS bundle
// AND queryClient.prefetchQuery() for the data the page needs.

type PrefetchConfig = {
  queryKey: readonly unknown[]
  queryFn: () => Promise<unknown>
  staleTime?: number
}

/**
 * Route-to-data prefetch mapping.
 * Only includes routes whose pages use TanStack Query hooks (client-fetched data).
 * Server Component pages (like admin/dashboard) don't need data prefetching here
 * since their data is fetched server-side.
 */
function getPrefetchConfigs(route: string): PrefetchConfig[] {
  // ── Admin routes ──
  if (route === "/admin/areas") {
    return [
      { queryKey: areaKeys.all, queryFn: async () => { const r = await getAreas(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 10 * 60 * 1000 },
    ]
  }
  if (route === "/admin/repository") {
    return [
      { queryKey: submissionKeys.all, queryFn: async () => { const r = await getAllSubmissions(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/admin/users") {
    return [
      { queryKey: userKeys.list(["FACULTY"]), queryFn: () => getUsers(["FACULTY"]), staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/admin/audit-logs") {
    return [
      { queryKey: auditLogKeys.all, queryFn: async () => { const r = await getAuditLogs(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 30 * 1000 },
    ]
  }
  if (route === "/admin/reports") {
    return [
      { queryKey: submissionKeys.all, queryFn: async () => { const r = await getAllSubmissions(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }

  // ── Dean routes ──
  if (route === "/dean/areas") {
    return [
      { queryKey: areaKeys.all, queryFn: async () => { const r = await getAreas(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 10 * 60 * 1000 },
    ]
  }
  if (route === "/dean/submissions") {
    return [
      { queryKey: submissionKeys.all, queryFn: async () => { const r = await getAllSubmissions(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/dean/assignments") {
    return [
      { queryKey: assignmentKeys.facultyList, queryFn: async () => { const r = await getFacultyWithAssignmentCounts(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/dean/repository") {
    return [
      { queryKey: submissionKeys.all, queryFn: async () => { const r = await getAllSubmissions(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/dean/users") {
    return [
      { queryKey: userKeys.list(["FACULTY"]), queryFn: () => getUsers(["FACULTY"]), staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/dean/audit-logs") {
    return [
      { queryKey: auditLogKeys.all, queryFn: async () => { const r = await getAuditLogs(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 30 * 1000 },
    ]
  }
  if (route === "/dean/tags") {
    return [
      { queryKey: tagKeys.all, queryFn: async () => { const r = await getTagsWithUsage(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 5 * 60 * 1000 },
    ]
  }
  if (route === "/dean/reports") {
    return [
      { queryKey: submissionKeys.all, queryFn: async () => { const r = await getAllSubmissions(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }

  // ── Faculty routes ──
  if (route === "/faculty/submissions") {
    return [
      { queryKey: submissionKeys.mine, queryFn: async () => { const r = await getMySubmissions(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 2 * 60 * 1000 },
    ]
  }
  if (route === "/faculty/notifications") {
    return [
      { queryKey: notificationKeys.all, queryFn: async () => { const r = await getNotifications(); if (!r.success) throw new Error(r.error); return r.data }, staleTime: 60 * 1000 },
    ]
  }

  return []
}

/**
 * Hook that returns a `prefetch(href)` function.
 * Call it from `onMouseEnter` / `onFocus` on sidebar links.
 *
 * It performs two types of prefetching:
 * 1. **Route prefetch** — `router.prefetch(href)` warms the Next.js JS bundle + RSC payload.
 * 2. **Data prefetch** — `queryClient.prefetchQuery()` warms the TanStack Query cache
 *    so the page renders with data immediately on navigation.
 */
export function usePrefetch() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const prefetch = useCallback(
    (href: string) => {
      // 1. Warm the Next.js route (JS chunk + RSC payload)
      router.prefetch(href)

      // 2. Warm the TanStack Query cache for this route's data
      const configs = getPrefetchConfigs(href)
      for (const config of configs) {
        queryClient.prefetchQuery({
          queryKey: config.queryKey,
          queryFn: config.queryFn,
          staleTime: config.staleTime ?? 3 * 60 * 1000,
        })
      }
    },
    [router, queryClient]
  )

  return prefetch
}
