import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, type UserWithCounts } from "@/actions/user.actions"
import { toggleFacultyStatus } from "@/actions/auth.actions"

export const userKeys = {
  all: ["users"] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => getUsers(),
    staleTime: 30_000, // Cache for 30s to reduce server load
    retry: 2, // Retry twice on failure (covers transient serverless cold starts)
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, activate }: { userId: string; activate: boolean }) =>
      toggleFacultyStatus(userId, activate),
    onSuccess: (result, variables) => {
      // Only optimistically update if the server action succeeded
      if (result && "success" in result && result.success) {
        queryClient.setQueryData<UserWithCounts[]>(userKeys.all, (old) => {
          if (!old) return []
          return old.map((u) =>
            u.id === variables.userId
              ? { ...u, status: variables.activate ? "ACTIVE" : "INACTIVE" }
              : u
          )
        })
      }
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    onError: (error) => {
      console.error("[useToggleUserStatus] Mutation error:", error)
      // Refetch to ensure UI is consistent after failed toggle
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
