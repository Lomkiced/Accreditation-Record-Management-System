import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getUsers,
  getArchivedUsers,
  deleteUserAccount,
  archiveUserAccount,
  restoreUserAccount,
  type UserWithCounts,
} from "@/actions/user.actions"
import { toggleFacultyStatus } from "@/actions/auth.actions"
import { Role } from "@prisma/client"

export const userKeys = {
  all: () => ["users"] as const,
  list: (roles?: Role[]) => ["users", "list", roles ? roles.join(",") : "all"] as const,
  archived: (roles?: Role[]) => ["users", "archived", roles ? roles.join(",") : "all"] as const,
}

export function useUsers(roles: Role[] = ["FACULTY"], initialData?: UserWithCounts[]) {
  return useQuery({
    queryKey: userKeys.list(roles),
    queryFn: () => getUsers(roles),
    initialData,
    staleTime: 2 * 60 * 1000, // 2 min — user list changes infrequently
    retry: 2, // Retry twice on failure
  })
}

export function useArchivedUsers(roles: Role[] = ["FACULTY"]) {
  return useQuery({
    queryKey: userKeys.archived(roles),
    queryFn: () => getArchivedUsers(roles),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, activate }: { userId: string; activate: boolean }) =>
      toggleFacultyStatus(userId, activate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
    onError: (error) => {
      console.error("[useToggleUserStatus] Mutation error:", error)
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
  })
}

export function useArchiveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => archiveUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
    onError: (error) => {
      console.error("[useArchiveUser] Mutation error:", error)
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
  })
}

export function useRestoreUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => restoreUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
    onError: (error) => {
      console.error("[useRestoreUser] Mutation error:", error)
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deleteUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
    onError: (error) => {
      console.error("[useDeleteUser] Mutation error:", error)
      queryClient.invalidateQueries({ queryKey: userKeys.all() })
    },
  })
}

