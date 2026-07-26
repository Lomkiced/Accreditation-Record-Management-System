"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getArchivedDocuments, archiveDocument, restoreDocument, permanentlyDeleteDocument } from "@/actions/submission.actions"
import { submissionKeys } from "./useSubmissions"

export const archiveKeys = {
  all: ["archives", "all"] as const,
}

export function useArchivedDocuments() {
  return useQuery({
    queryKey: archiveKeys.all,
    queryFn: async () => {
      const result = await getArchivedDocuments()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

export function useArchiveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      queryClient.invalidateQueries({ queryKey: archiveKeys.all })
      toast.success("Document archived.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to archive document.")
    },
  })
}

export function useRestoreDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      queryClient.invalidateQueries({ queryKey: archiveKeys.all })
      toast.success("Document restored.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to restore document.")
    },
  })
}

export function usePermanentlyDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: archiveKeys.all })
      toast.success("Document permanently deleted.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document.")
    },
  })
}
