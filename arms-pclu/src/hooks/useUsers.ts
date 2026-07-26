import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, deleteUserAccount, type UserWithCounts } from "@/actions/user.actions"
import { toggleFacultyStatus } from "@/actions/auth.actions"
import { Role } from "@prisma/client"

export const userKeys = {
  all: () => ["users"] as const,
  list: (roles?: Role[]) => ["users", "list", roles ? roles.join(",") : "all"] as const,
}

export function useUsers(roles: Role[] = ["FACULTY"]) {
  return useQuery({
    queryKey: userKeys.list(roles),
    queryFn: () => getUsers(roles),
    staleTime: 30_000, // Cache for 30s to reduce server load
    retry: 2, // Retry twice on failure
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
