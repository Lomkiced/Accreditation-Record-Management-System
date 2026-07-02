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
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, activate }: { userId: string; activate: boolean }) =>
      toggleFacultyStatus(userId, activate),
    onSuccess: (_, variables) => {
      // Optimistically update or invalidate
      queryClient.setQueryData<UserWithCounts[]>(userKeys.all, (old) => {
        if (!old) return []
        return old.map((u) =>
          u.id === variables.userId
            ? { ...u, status: variables.activate ? "ACTIVE" : "INACTIVE" }
            : u
        )
      })
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
