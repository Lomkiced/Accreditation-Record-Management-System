import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getLogbookEntries, createLogbookEntry, updateLogbookStatus, type LogbookEntryWithUser } from "@/actions/logbook.actions"
import { type LogbookEntryInput } from "@/lib/validations/logbook.schema"

export const logbookKeys = {
  all: ["logbook"] as const,
}

export function useLogbook() {
  return useQuery({
    queryKey: logbookKeys.all,
    queryFn: () => getLogbookEntries(),
  })
}

export function useCreateLogbookEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LogbookEntryInput) => createLogbookEntry({ ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.all })
    },
  })
}

export function useUpdateLogbookStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: "ACKNOWLEDGED" | "REJECTED"; remarks?: string }) => 
      updateLogbookStatus(id, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.all })
    },
  })
}
