import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAuditLogs, clearAuditLogs } from "@/actions/audit.actions"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { dashboardKeys } from "./useDashboard"

export const auditLogKeys = {
  all: ["audit-logs", "all"] as const,
}

export function useAuditLogs() {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    // 1. Initialize Supabase Client
    const supabase = createClient()

    // 2. Subscribe to Postgres Database Changes for the 'AuditLog' table
    // This provides true Real-Time capabilities via WebSockets.
    const channel = supabase
      .channel('realtime-audit-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'AuditLog' },
        (payload) => {
          console.log("[Realtime] New Audit Log detected:", payload)
          // 3. Immediately invalidate the cache to force a fresh UI refetch
          queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: auditLogKeys.all,
    queryFn: async () => {
      const result = await getAuditLogs()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    // Fresh for 30 seconds; Realtime WebSocket bypasses this on INSERT.
    staleTime: 1000 * 30,
    // No polling needed — the Supabase Realtime channel subscription above
    // handles real-time pushes and invalidates the cache on INSERT events.
  })
}

export function useClearAuditLogs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearAuditLogs(),
    onSuccess: (result) => {
      if (!result.success) throw new Error(result.error)
      toast.success("Audit logs cleared successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to clear audit logs.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    }
  })
}
