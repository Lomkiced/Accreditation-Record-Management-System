/**
 * Supabase Storage upload utility — client-side only.
 *
 * Uses the browser Supabase client (anon key) so that Row Level Security
 * is enforced. The file is uploaded to a path scoped to the user's ID to
 * prevent cross-user overwrites.
 *
 * Bucket: configured via NEXT_PUBLIC_SUPABASE_BUCKET env var (default: "documents")
 */

import { createClient } from "@/lib/supabase/client"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "documents"

export interface UploadResult {
  fileUrl: string
  fileName: string
  fileSize: number
  storagePath: string
}

/**
 * Uploads a File to Supabase Storage and returns the public URL + metadata.
 *
 * @param file       - The File object from the input / drop zone
 * @param userId     - Scopes the storage path: `{userId}/{timestamp}-{sanitizedName}`
 * @param onProgress - Optional callback receiving upload progress (0–100)
 */
export async function uploadFileToStorage(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const supabase = createClient()

  // Sanitize filename: replace spaces and special chars with underscores
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const timestamp = Date.now()
  const storagePath = `${userId}/${timestamp}-${safeName}`

  // Signal start
  onProgress?.(0)

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message || "File upload failed.")
  }

  // Signal completion
  onProgress?.(100)

  // Retrieve the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path)

  return {
    fileUrl: publicUrl,
    fileName: file.name,
    fileSize: file.size,
    storagePath: data.path,
  }
}

/**
 * Deletes a file from Supabase Storage by its storage path.
 * Call this on rollback / document delete.
 */
export async function deleteFileFromStorage(
  storagePath: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (error) {
    // Non-fatal: log but don't throw (file may already be gone)
    console.warn("[deleteFileFromStorage]", error.message)
  }
}
