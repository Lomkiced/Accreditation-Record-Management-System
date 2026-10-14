/**
 * Shared storage utility functions for parsing Supabase file URLs and paths.
 * Note: Keep this file free of "use server" so utilities can be used across
 * both server actions, server components, and client components synchronously.
 */

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
