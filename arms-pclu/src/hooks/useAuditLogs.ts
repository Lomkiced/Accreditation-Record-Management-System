import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAuditLogs } from "@/actions/audit.actions"
import { createClient } from "@/lib/supabase/client"

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
    // Longer fallback poll (60s) only if Realtime is unavailable.
    // The Supabase channel subscription above handles real-time pushes.
    refetchInterval: 60_000,
  })
}
