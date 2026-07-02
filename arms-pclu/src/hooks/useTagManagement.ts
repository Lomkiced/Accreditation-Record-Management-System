import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getTagsWithUsage,
  createCustomTag,
  updateCustomTag,
  deleteCustomTag,
} from "@/actions/tag.actions"

export const tagKeys = {
  all: ["tag-management", "all"] as const,
}

export function useTagManagement() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: async () => {
      const result = await getTagsWithUsage()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; color: string }) => createCustomTag(data),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Tag created successfully")
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create tag")
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { tagId: string; name: string; color: string }) => 
      updateCustomTag(data.tagId, { name: data.name, color: data.color }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Tag updated successfully")
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update tag")
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => deleteCustomTag(tagId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Tag deleted successfully")
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete tag")
    },
  })
}
