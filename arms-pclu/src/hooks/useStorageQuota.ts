"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getMyStorageQuota,
  getRepositoryStorageQuota,
} from "@/actions/storage.actions"
import type { StorageQuotaInfo } from "@/types/storage.types"

export const storageQuotaKeys = {
  all: ["storage-quota"] as const,
  mine: () => [...storageQuotaKeys.all, "mine"] as const,
  repository: () => [...storageQuotaKeys.all, "repository"] as const,
}

export function useMyStorageQuota(initialData?: StorageQuotaInfo) {
  return useQuery({
    queryKey: storageQuotaKeys.mine(),
    queryFn: async () => {
      const res = await getMyStorageQuota()
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch storage quota.")
      }
      return res.data
    },
    initialData,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useRepositoryStorageQuota(initialData?: StorageQuotaInfo) {
  return useQuery({
    queryKey: storageQuotaKeys.repository(),
    queryFn: async () => {
      const res = await getRepositoryStorageQuota()
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch repository storage quota.")
      }
      return res.data
    },
    initialData,
    staleTime: 1000 * 30,
  })
}
