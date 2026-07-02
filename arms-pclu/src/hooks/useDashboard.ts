import { useQuery } from "@tanstack/react-query"
import {
  getDashboardStats,
  getPendingSubmissions,
  getRecentAuditLogs,
  getComplianceData,
} from "@/actions/dashboard.actions"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  pending: () => [...dashboardKeys.all, "pending"] as const,
  logs: () => [...dashboardKeys.all, "logs"] as const,
  compliance: () => [...dashboardKeys.all, "compliance"] as const,
}

// Optional: refresh every 1 minute
const STALE_TIME = 60 * 1000 

export function useDashboardStats(initialData?: any) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => getDashboardStats(),
    initialData,
    staleTime: STALE_TIME,
  })
}

export function usePendingSubmissions(initialData?: any) {
  return useQuery({
    queryKey: dashboardKeys.pending(),
    queryFn: () => getPendingSubmissions(),
    initialData,
    staleTime: STALE_TIME,
  })
}

export function useRecentAuditLogs(initialData?: any) {
  return useQuery({
    queryKey: dashboardKeys.logs(),
    queryFn: () => getRecentAuditLogs(),
    initialData,
    staleTime: STALE_TIME,
  })
}

export function useComplianceData() {
  return useQuery({
    queryKey: dashboardKeys.compliance(),
    queryFn: () => getComplianceData(),
    staleTime: STALE_TIME,
  })
}
