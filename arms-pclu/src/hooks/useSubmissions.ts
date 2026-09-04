"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getMySubmissions,
  uploadAndMapDocument,
  uploadAndMapBatchDocuments,
  saveDocumentAsDraft,
  getAllSubmissions,
  getApprovedSubmissions,
  reviewSubmission,
  markSubmissionUnderReview,
} from "@/actions/submission.actions"
import { submitAllMappings, deleteDocument } from "@/actions/document.actions"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const submissionKeys = {
  mine: ["submissions", "mine"] as const,
  all: ["submissions", "all"] as const,
  approved: ["submissions", "approved"] as const,
}

// ─── GET MY SUBMISSIONS ───────────────────────────────────────────────────────

export function useMySubmissions(initialData?: Extract<Awaited<ReturnType<typeof getMySubmissions>>, { success: true }>["data"]) {
  return useQuery({
    queryKey: submissionKeys.mine,
    initialData,
    queryFn: async () => {
      const result = await getMySubmissions()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// ─── SUBMIT DOCUMENT (SUBMITTED status) ──────────────────────────────────────

export function useSubmitDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof uploadAndMapDocument>[0]) => uploadAndMapDocument({ ...data }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success("Document submitted for review.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit document.")
    },
  })
}

// ─── SUBMIT BATCH DOCUMENTS (SUBMITTED status) ───────────────────────────────

export function useSubmitBatchDocuments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof uploadAndMapBatchDocuments>[0]) => uploadAndMapBatchDocuments(data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success(`${res.data?.count ?? "Files"} documents submitted for review.`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit batch documents.")
    },
  })
}

// ─── SAVE DOCUMENT AS DRAFT ───────────────────────────────────────────────────

export function useSaveDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof saveDocumentAsDraft>[0]) => saveDocumentAsDraft({ ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success("Draft saved successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save draft.")
    },
  })
}

// ─── SUBMIT ALL MAPPINGS (From Draft to Submitted) ───────────────────────────

export function useSubmitAllMappings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => submitAllMappings(documentId),
    onSuccess: (result) => {
      if (!result.success) throw new Error(result.error)
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success(`Successfully submitted ${result.data?.submittedCount} mappings for review.`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit mappings.")
    },
  })
}

// ─── GET ALL SUBMISSIONS (Admin view) ────────────────────────────────────────

type AllSubmissionsData = NonNullable<Extract<Awaited<ReturnType<typeof getAllSubmissions>>, { success: true }>["data"]>

export function useAllSubmissions(initialData?: AllSubmissionsData) {
  return useQuery({
    queryKey: submissionKeys.all,
    queryFn: async () => {
      const result = await getAllSubmissions()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    initialData,
    staleTime: 1000 * 60 * 2,
  })
}

// ─── GET APPROVED SUBMISSIONS (Dean Repository view) ─────────────────────────

type ApprovedSubmissionsData = NonNullable<Extract<Awaited<ReturnType<typeof getApprovedSubmissions>>, { success: true }>["data"]>

export function useApprovedSubmissions(initialData?: ApprovedSubmissionsData) {
  return useQuery({
    queryKey: submissionKeys.approved,
    queryFn: async () => {
      const result = await getApprovedSubmissions()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    initialData,
    staleTime: 1000 * 60 * 2,
  })
}

// ─── REVIEW SUBMISSION (Admin view) ──────────────────────────────────────────

export function useMarkSubmissionUnderReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mappingId: string) => markSubmissionUnderReview(mappingId),
    onMutate: async (mappingId) => {
      await queryClient.cancelQueries({ queryKey: submissionKeys.all })
      const previousSubmissions = queryClient.getQueryData<any[]>(submissionKeys.all)

      if (previousSubmissions) {
        queryClient.setQueryData(
          submissionKeys.all,
          previousSubmissions.map((sub) => 
            sub.id === mappingId && sub.status === "SUBMITTED"
              ? { ...sub, status: "UNDER_REVIEW" } 
              : sub
          )
        )
      }
      return { previousSubmissions }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(submissionKeys.all, context.previousSubmissions)
      }
      console.error("Failed to auto-mark as under review", error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all })
    }
  })
}


export function useReviewSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof reviewSubmission>[0]) => reviewSubmission({ ...data }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: submissionKeys.all })
      const previousSubmissions = queryClient.getQueryData<any[]>(submissionKeys.all)

      if (previousSubmissions) {
        queryClient.setQueryData(
          submissionKeys.all,
          previousSubmissions.map((sub) => 
            sub.id === data.mappingId 
              ? { ...sub, status: data.status, remarks: data.remarks ?? null } 
              : sub
          )
        )
      }
      return { previousSubmissions }
    },
    onSuccess: () => {
      toast.success("Submission reviewed successfully.")
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(submissionKeys.all, context.previousSubmissions)
      }
      toast.error(error.message || "Failed to review submission.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all })
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
    }
  })
}

// ─── TAGS ────────────────────────────────────────────────────────────────────

import { getAllTags, toggleDocumentTag } from "@/actions/document.actions"

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const result = await getAllTags()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useToggleTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { documentId: string; tagId: string; add: boolean }) => 
      toggleDocumentTag(data.documentId, data.tagId, data.add),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all })
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success("Tags updated successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update tags.")
    },
  })
}

// ─── DELETE DOCUMENT ─────────────────────────────────────────────────────────

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
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
    onSuccess: (result) => {
      if (!result.success) throw new Error(result.error)
      toast.success("Document deleted successfully.")
    },
    onError: (error: Error, id, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(submissionKeys.mine, context.previousSubmissions)
      }
      toast.error(error.message || "Failed to delete document.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      queryClient.invalidateQueries({ queryKey: submissionKeys.all })
    }
  })
}
