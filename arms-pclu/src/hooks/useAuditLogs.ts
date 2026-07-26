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
    // The data is considered fresh for 30 seconds.
    // However, if the Realtime WebSocket pushes an event, this is bypassed.
    staleTime: 1000 * 30,
    
    // Robust Fallback: Poll every 10 seconds in case Supabase Replication 
    // is disabled on the AuditLog table or WebSocket connection drops.
    refetchInterval: 10000,
  })
}
