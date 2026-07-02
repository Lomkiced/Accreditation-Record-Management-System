"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notification.actions"
import { toast } from "sonner"

export const notificationKeys = {
  all: ["notifications"] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const result = await getNotifications()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60, // 1 min
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success("All notifications marked as read.")
    },
  })
}

