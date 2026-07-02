import { useQuery } from "@tanstack/react-query"
import { getAuditLogs } from "@/actions/audit.actions"

export const auditLogKeys = {
  all: ["audit-logs", "all"] as const,
}

export function useAuditLogs() {
  return useQuery({
    queryKey: auditLogKeys.all,
    queryFn: async () => {
      const result = await getAuditLogs()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
