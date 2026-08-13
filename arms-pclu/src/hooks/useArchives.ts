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
    staleTime: 1000 * 60 * 5, // 5 minutes — archives change infrequently
  })
}

export function useArchiveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveDocument(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: submissionKeys.mine })
      const previousSubmissions = queryClient.getQueryData<any[]>(submissionKeys.mine)

      if (previousSubmissions) {
        queryClient.setQueryData(
          submissionKeys.mine,
          previousSubmissions.filter((mapping) => mapping.documentId !== id)
        )
      }
      return { previousSubmissions }
    },
    onSuccess: () => {
      toast.success("Document archived.")
    },
    onError: (error: Error, id, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(submissionKeys.mine, context.previousSubmissions)
      }
      toast.error(error.message || "Failed to archive document.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      queryClient.invalidateQueries({ queryKey: archiveKeys.all })
    }
  })
}

export function useRestoreDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: archiveKeys.all })
      const previousArchives = queryClient.getQueryData<any[]>(archiveKeys.all)

      if (previousArchives) {
        queryClient.setQueryData(
          archiveKeys.all,
          previousArchives.filter((doc) => doc.id !== id)
        )
      }
      return { previousArchives }
    },
    onSuccess: () => {
      toast.success("Document restored.")
    },
    onError: (error: Error, id, context) => {
      if (context?.previousArchives) {
        queryClient.setQueryData(archiveKeys.all, context.previousArchives)
      }
      toast.error(error.message || "Failed to restore document.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      queryClient.invalidateQueries({ queryKey: archiveKeys.all })
    }
  })
}

export function usePermanentlyDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteDocument(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: archiveKeys.all })
      const previousArchives = queryClient.getQueryData<any[]>(archiveKeys.all)

      if (previousArchives) {
        queryClient.setQueryData(
          archiveKeys.all,
          previousArchives.filter((doc) => doc.id !== id)
        )
      }
      return { previousArchives }
    },
    onSuccess: () => {
      toast.success("Document permanently deleted.")
    },
    onError: (error: Error, id, context) => {
      if (context?.previousArchives) {
        queryClient.setQueryData(archiveKeys.all, context.previousArchives)
      }
      toast.error(error.message || "Failed to delete document.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: archiveKeys.all })
    }
  })
}
