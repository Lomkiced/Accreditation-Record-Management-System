"use server"

import { prisma } from "@/lib/prisma"
import { requireUser, requireAdminOrDean } from "@/lib/auth/getUser"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  FACULTY_STORAGE_QUOTA_BYTES,
  DEAN_ADMIN_STORAGE_QUOTA_BYTES,
  type StorageQuotaInfo,
} from "@/types/storage.types"

export type { StorageQuotaInfo }

type ActionResult<T> =
  | { success: true; data: T; error?: never }
  | { success?: false; error: string; data?: never }

// ─── Storage Path Extraction Helper ──────────────────────────────────────────
export function extractStoragePath(fileUrl: string, bucket = "documents"): string | null {
  try {
    const url = new URL(fileUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx !== -1) {
      return decodeURIComponent(url.pathname.substring(idx + marker.length))
    }
    const altMarker = `/${bucket}/`
    const altIdx = url.pathname.indexOf(altMarker)
    if (altIdx !== -1) {
      return decodeURIComponent(url.pathname.substring(altIdx + altMarker.length))
    }
    return null
  } catch {
    const clean = fileUrl.split("?")[0]
    const marker = `/${bucket}/`
    const idx = clean.indexOf(marker)
    if (idx !== -1) {
      return decodeURIComponent(clean.substring(idx + marker.length))
    }
    const bucketPrefix = `${bucket}/`
    if (clean.startsWith(bucketPrefix)) {
      return decodeURIComponent(clean.substring(bucketPrefix.length))
    }
    return clean || null
  }
}

// ─── Reference-Counted Physical Storage Purging Helper ────────────────────────
export async function deleteStorageFileIfOrphaned(
  fileUrl: string | null | undefined
): Promise<{ deleted: boolean; remainingReferences: number }> {
  if (!fileUrl) return { deleted: false, remainingReferences: 0 }

  const [docCount, verCount] = await Promise.all([
    prisma.document.count({ where: { fileUrl } }),
    prisma.documentVersion.count({ where: { fileUrl } }),
  ])

  const remainingReferences = docCount + verCount
  if (remainingReferences > 0) {
    // Other records or tagged copies still reference this file in Supabase Storage!
    return { deleted: false, remainingReferences }
  }

  // Reference count === 0: last remaining reference in the database was deleted.
  try {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "documents"
    const storagePath = extractStoragePath(fileUrl, bucket)
    if (storagePath) {
      const adminSupabase = createAdminClient()
      const { error } = await adminSupabase.storage
        .from(bucket)
        .remove([storagePath])
      if (error) {
        console.warn("[deleteStorageFileIfOrphaned] Storage removal warning:", error.message)
      } else {
        return { deleted: true, remainingReferences: 0 }
      }
    }
  } catch (err) {
    console.error("[deleteStorageFileIfOrphaned] Error removing file from storage:", err)
  }

  return { deleted: false, remainingReferences: 0 }
}

// ─── Helper: Compute Faculty Storage Consumption ─────────────────────────────
// Zero-Multiplication Invariant: Each distinct exhibit file is summed once.
// Cross-Faculty Invariant: Deducted strictly from original uploader; Area Owners incur 0 MB.
export async function calculateFacultyStorageUsage(
  userId: string
): Promise<StorageQuotaInfo> {
  // 1. Fetch all active, non-deleted documents uploaded by this faculty member
  // (Excludes copies tagged to this user by peer faculty; includes primary uploads)
  const activeDocs = await prisma.document.findMany({
    where: {
      OR: [
        { originalUploaderId: userId },
        { userId, originalUploaderId: null },
      ],
      isArchived: false,
      isDeletedByFaculty: false,
    },
    select: {
      id: true,
      fileUrl: true,
      fileSize: true,
    },
  })

  // 2. Fetch all historical version snapshots for active documents owned by this faculty
  const versionSnapshots = await prisma.documentVersion.findMany({
    where: {
      document: {
        OR: [
          { originalUploaderId: userId },
          { userId, originalUploaderId: null },
        ],
        isArchived: false,
        isDeletedByFaculty: false,
      },
    },
    select: {
      id: true,
      fileUrl: true,
      fileSize: true,
    },
  })

  // Deduplicate exhibits by fileUrl so multi-tagging copies consume storage only ONCE
  const seenFileUrls = new Set<string>()
  let docBytes = 0
  for (const doc of activeDocs) {
    const key = doc.fileUrl || doc.id
    if (!seenFileUrls.has(key)) {
      seenFileUrls.add(key)
      docBytes += doc.fileSize ?? 0
    }
  }

  let versionBytes = 0
  for (const ver of versionSnapshots) {
    const key = ver.fileUrl || ver.id
    if (!seenFileUrls.has(key)) {
      seenFileUrls.add(key)
      versionBytes += ver.fileSize ?? 0
    }
  }

  const totalUsedBytes = docBytes + versionBytes
  const quotaBytes = FACULTY_STORAGE_QUOTA_BYTES

  const usedMB = Number((totalUsedBytes / (1024 * 1024)).toFixed(2))
  const quotaMB = Number((quotaBytes / (1024 * 1024)).toFixed(0))
  const availableBytes = Math.max(0, quotaBytes - totalUsedBytes)
  const availableMB = Number((availableBytes / (1024 * 1024)).toFixed(2))
  const usagePercentage = Math.min(
    100,
    Number(((totalUsedBytes / quotaBytes) * 100).toFixed(1))
  )

  return {
    realm: "FACULTY",
    usedBytes: totalUsedBytes,
    quotaBytes,
    usedMB,
    quotaMB,
    availableBytes,
    availableMB,
    usagePercentage,
    isLimitExceeded: totalUsedBytes >= quotaBytes,
    isWarning: usagePercentage >= 70 && usagePercentage < 90,
    isCritical: usagePercentage >= 90,
    totalDocumentsCount: seenFileUrls.size,
  }
}

// ─── Helper: Compute Dean/Admin Central Repository Storage Consumption ─────────
// Shared between Dean and Admin.
// Evaluates distinct approved documents actively retained in repository.
export async function calculateDeanAdminRepositoryStorageUsage(): Promise<StorageQuotaInfo> {
  // Query distinct documents that are in the repository with at least one APPROVED mapping
  const approvedDocs = await prisma.document.findMany({
    where: {
      isArchivedFromRepo: false,
      mappings: {
        some: {
          status: "APPROVED",
        },
      },
    },
    select: {
      id: true,
      fileSize: true,
    },
  })

  const totalUsedBytes = approvedDocs.reduce(
    (acc, doc) => acc + (doc.fileSize ?? 0),
    0
  )
  const quotaBytes = DEAN_ADMIN_STORAGE_QUOTA_BYTES

  const usedMB = Number((totalUsedBytes / (1024 * 1024)).toFixed(2))
  const quotaMB = Number((quotaBytes / (1024 * 1024)).toFixed(0))
  const availableBytes = Math.max(0, quotaBytes - totalUsedBytes)
  const availableMB = Number((availableBytes / (1024 * 1024)).toFixed(2))
  const usagePercentage = Math.min(
    100,
    Number(((totalUsedBytes / quotaBytes) * 100).toFixed(1))
  )

  return {
    realm: "DEAN_ADMIN_REPOSITORY",
    usedBytes: totalUsedBytes,
    quotaBytes,
    usedMB,
    quotaMB,
    availableBytes,
    availableMB,
    usagePercentage,
    isLimitExceeded: totalUsedBytes >= quotaBytes,
    isWarning: usagePercentage >= 70 && usagePercentage < 90,
    isCritical: usagePercentage >= 90,
    totalDocumentsCount: approvedDocs.length,
  }
}

// ─── Pre-Upload Storage Guardrail ─────────────────────────────────────────────
export async function verifyStorageQuotaPreflight(
  userId: string,
  incomingBytes: number
): Promise<{ allowed: boolean; error?: string }> {
  if (incomingBytes <= 0) return { allowed: true }

  const quota = await calculateFacultyStorageUsage(userId)
  if (quota.usedBytes + incomingBytes > quota.quotaBytes) {
    return {
      allowed: false,
      error: `Storage limit exceeded. Available: ${quota.availableMB} MB / Limit: ${quota.quotaMB} MB.`,
    }
  }

  return { allowed: true }
}

// ─── Duplicate Evidence Check within Single Indicator ─────────────────────────
// Strict Error Wording Invariant: "Duplicate file detected. This document already exists."
// Case-insensitive, trimmed, scoped strictly to the target indicator.
// Excludes archived or soft-deleted records.
export async function checkIndicatorDuplicateTitle(
  indicatorId: string,
  title: string,
  excludeDocumentId?: string
): Promise<boolean> {
  const normalizedTitle = title.trim()
  if (!normalizedTitle) return false

  const duplicate = await prisma.documentMapping.findFirst({
    where: {
      indicatorId,
      ...(excludeDocumentId ? { documentId: { not: excludeDocumentId } } : {}),
      document: {
        isArchived: false,
        isDeletedByFaculty: false,
        title: {
          equals: normalizedTitle,
          mode: "insensitive",
        },
      },
    },
    select: { id: true },
  })

  return !!duplicate
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getMyStorageQuota(): Promise<
  ActionResult<StorageQuotaInfo>
> {
  try {
    const user = await requireUser()
    const quota = await calculateFacultyStorageUsage(user.id)
    return { success: true, data: quota }
  } catch (error: any) {
    return {
      error: error?.message ?? "Failed to retrieve storage quota details.",
    }
  }
}

export async function getRepositoryStorageQuota(): Promise<
  ActionResult<StorageQuotaInfo>
> {
  try {
    await requireAdminOrDean()
    const quota = await calculateDeanAdminRepositoryStorageUsage()
    return { success: true, data: quota }
  } catch (error: any) {
    return {
      error:
        error?.message ?? "Failed to retrieve repository storage quota details.",
    }
  }
}

export async function checkDuplicateEvidenceAction(input: {
  indicatorId: string
  title: string
  excludeDocumentId?: string
}): Promise<ActionResult<{ isDuplicate: boolean }>> {
  try {
    await requireUser()
    const isDuplicate = await checkIndicatorDuplicateTitle(
      input.indicatorId,
      input.title,
      input.excludeDocumentId
    )
    return { success: true, data: { isDuplicate } }
  } catch (error: any) {
    return {
      error: error?.message ?? "Failed to verify evidence uniqueness.",
    }
  }
}
