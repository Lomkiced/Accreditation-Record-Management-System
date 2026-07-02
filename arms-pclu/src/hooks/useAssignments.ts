"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getAssignmentsForFaculty,
  getFacultyWithAssignmentCounts,
  getAssignedScopeForFaculty,
  createAssignment,
  deleteAssignment,
} from "@/actions/assignment.actions"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const assignmentKeys = {
  all: ["assignments"] as const,
  forFaculty: (userId: string) => ["assignments", "faculty", userId] as const,
  scope: (userId: string) => ["assignments", "scope", userId] as const,
  facultyList: ["assignments", "faculty-list"] as const,
}

// ─── GET ASSIGNMENTS FOR A FACULTY MEMBER ────────────────────────────────────

export function useAssignments(userId: string) {
  return useQuery({
    queryKey: assignmentKeys.forFaculty(userId),
    queryFn: async () => {
      const result = await getAssignmentsForFaculty(userId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// ─── GET ASSIGNMENT SCOPE (area/criterion IDs) FOR FILTERING ─────────────────

export function useAssignedScope(userId?: string) {
  return useQuery({
    queryKey: assignmentKeys.scope(userId ?? ""),
    queryFn: async () => {
      const result = await getAssignedScopeForFaculty(userId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

// ─── GET FACULTY LIST WITH ASSIGNMENT COUNTS ─────────────────────────────────

export function useFacultyList() {
  return useQuery({
    queryKey: assignmentKeys.facultyList,
    queryFn: async () => {
      const result = await getFacultyWithAssignmentCounts()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// ─── CREATE ASSIGNMENT ────────────────────────────────────────────────────────

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAssignment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.forFaculty(variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.scope(variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.facultyList,
      })
      toast.success("Assignment created successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create assignment.")
    },
  })
}

// ─── DELETE ASSIGNMENT ────────────────────────────────────────────────────────

export function useDeleteAssignment(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAssignment,
    onMutate: async (assignmentId: string) => {
      await queryClient.cancelQueries({
        queryKey: assignmentKeys.forFaculty(userId),
      })
      const previous = queryClient.getQueryData(
        assignmentKeys.forFaculty(userId)
      )
      queryClient.setQueryData<Array<{ id: string }>>(
        assignmentKeys.forFaculty(userId),
        (old) =>
          old
            ? old.filter((a) => a.id !== assignmentId)
            : []
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          assignmentKeys.forFaculty(userId),
          context.previous
        )
      }
      toast.error("Failed to delete assignment.")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.forFaculty(userId),
      })
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.facultyList,
      })
      toast.success("Assignment removed.")
    },
  })
}
