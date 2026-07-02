"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getMySubmissions,
  uploadAndMapDocument,
  saveDocumentAsDraft,
  getAllSubmissions,
  reviewSubmission,
} from "@/actions/submission.actions"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const submissionKeys = {
  mine: ["submissions", "mine"] as const,
  all: ["submissions", "all"] as const,
}

// ─── GET MY SUBMISSIONS ───────────────────────────────────────────────────────

export function useMySubmissions() {
  return useQuery({
    queryKey: submissionKeys.mine,
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
    mutationFn: uploadAndMapDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success("Document submitted for review.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit document.")
    },
  })
}

// ─── SAVE DOCUMENT AS DRAFT ───────────────────────────────────────────────────

export function useSaveDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveDocumentAsDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success("Draft saved successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save draft.")
    },
  })
}

// ─── GET ALL SUBMISSIONS (Admin view) ────────────────────────────────────────

export function useAllSubmissions() {
  return useQuery({
    queryKey: submissionKeys.all,
    queryFn: async () => {
      const result = await getAllSubmissions()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// ─── REVIEW SUBMISSION (Admin view) ──────────────────────────────────────────

export function useReviewSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all })
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      toast.success("Submission reviewed successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to review submission.")
    },
  })
}
