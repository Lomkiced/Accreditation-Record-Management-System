// ─── Storage Quota Constants ──────────────────────────────────────────────────
export const FACULTY_STORAGE_QUOTA_BYTES = 100 * 1024 * 1024 // 100 MB
export const DEAN_ADMIN_STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024 // 1 GB (1,073,741,824 bytes)

export interface StorageQuotaInfo {
  realm: "FACULTY" | "DEAN_ADMIN_REPOSITORY"
  usedBytes: number
  quotaBytes: number
  usedMB: number
  quotaMB: number
  availableBytes: number
  availableMB: number
  usagePercentage: number
  isLimitExceeded: boolean
  isWarning: boolean // >= 70%
  isCritical: boolean // >= 90%
  totalDocumentsCount: number
}
