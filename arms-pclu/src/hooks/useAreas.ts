"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  reorderAreas,
} from "@/actions/area.actions"
import {
  getCriteriaByArea,
  createCriterion,
  updateCriterion,
  deleteCriterion,
} from "@/actions/criterion.actions"
import {
  getIndicatorsByCriterion,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} from "@/actions/indicator.actions"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const areaKeys = {
  all: ["areas"] as const,
  criteria: (areaId: string) => ["areas", areaId, "criteria"] as const,
  indicators: (criterionId: string) =>
    ["criteria", criterionId, "indicators"] as const,
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREAS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAreas() {
  return useQuery({
    queryKey: areaKeys.all,
    queryFn: async () => {
      const result = await getAreas()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Parameters<typeof createArea>[0]) => {
      const res = await createArea(data)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Area created successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create area.")
    },
  })
}

export function useUpdateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updateArea>[1] }) => {
      const res = await updateArea(id, data)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Area updated successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update area.")
    },
  })
}

export function useDeleteArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (areaId: string) => {
      const res = await deleteArea(areaId)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onMutate: async (areaId: string) => {
      // Optimistic update — remove from cache immediately
      await queryClient.cancelQueries({ queryKey: areaKeys.all })
      const previous = queryClient.getQueryData(areaKeys.all)
      queryClient.setQueryData<Array<{ id: string }>>(areaKeys.all, (old) =>
        old ? old.filter((a) => a.id !== areaId) : []
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(areaKeys.all, context.previous)
      }
      toast.error(error.message || "Failed to delete area.")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Area deleted.")
    },
  })
}

export function useReorderAreas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await reorderAreas(orderedIds)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder areas.")
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRITERIA
// ═══════════════════════════════════════════════════════════════════════════════

export function useCriteria(areaId: string) {
  return useQuery({
    queryKey: areaKeys.criteria(areaId),
    queryFn: async () => {
      const result = await getCriteriaByArea(areaId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!areaId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCriterion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Parameters<typeof createCriterion>[0]) => {
      const res = await createCriterion(data)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: areaKeys.criteria(variables.areaId),
      })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Criterion created successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create criterion.")
    },
  })
}

export function useUpdateCriterion(areaId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updateCriterion>[1] }) => {
      const res = await updateCriterion(id, data)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.criteria(areaId) })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Criterion updated successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update criterion.")
    },
  })
}

export function useDeleteCriterion(areaId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (criterionId: string) => {
      const res = await deleteCriterion(criterionId)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onMutate: async (criterionId: string) => {
      await queryClient.cancelQueries({
        queryKey: areaKeys.criteria(areaId),
      })
      const previous = queryClient.getQueryData(areaKeys.criteria(areaId))
      queryClient.setQueryData<Array<{ id: string }>>(areaKeys.criteria(areaId), (old) =>
        old ? old.filter((c) => c.id !== criterionId) : []
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(areaKeys.criteria(areaId), context.previous)
      }
      toast.error(error.message || "Failed to delete criterion.")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.criteria(areaId) })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Criterion deleted.")
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDICATORS
// ═══════════════════════════════════════════════════════════════════════════════

export function useIndicators(criterionId: string) {
  return useQuery({
    queryKey: areaKeys.indicators(criterionId),
    queryFn: async () => {
      const result = await getIndicatorsByCriterion(criterionId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!criterionId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateIndicator(criterionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Parameters<typeof createIndicator>[0]) => {
      const res = await createIndicator(data)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: areaKeys.indicators(criterionId),
      })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Indicator created successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create indicator.")
    },
  })
}

export function useUpdateIndicator(criterionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updateIndicator>[1] }) => {
      const res = await updateIndicator(id, data)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: areaKeys.indicators(criterionId),
      })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Indicator updated successfully.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update indicator.")
    },
  })
}

export function useDeleteIndicator(criterionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (indicatorId: string) => {
      const res = await deleteIndicator(indicatorId)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onMutate: async (indicatorId: string) => {
      await queryClient.cancelQueries({
        queryKey: areaKeys.indicators(criterionId),
      })
      const previous = queryClient.getQueryData(areaKeys.indicators(criterionId))
      queryClient.setQueryData<Array<{ id: string }>>(areaKeys.indicators(criterionId), (old) =>
        old ? old.filter((i) => i.id !== indicatorId) : []
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          areaKeys.indicators(criterionId),
          context.previous
        )
      }
      toast.error(error.message || "Failed to delete indicator.")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: areaKeys.indicators(criterionId),
      })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      toast.success("Indicator deleted.")
    },
  })
}
