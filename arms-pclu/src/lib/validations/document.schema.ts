import { z } from "zod"

// ─── Upload a Document to the central repository ──────────────────────────────
export const uploadDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required").max(255),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
  // fileUrl is set after the Supabase Storage upload on the client
  fileUrl: z.string().url("Invalid file URL").optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>

// ─── Create M:N evidence mappings ────────────────────────────────────────────
export const createMappingsSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  indicatorIds: z
    .array(z.string().uuid("Invalid indicator ID"))
    .min(1, "Select at least one indicator"),
  rating: z.number().min(1).max(5).optional(),
})

export type CreateMappingsInput = z.infer<typeof createMappingsSchema>

// ─── Submit / review a single mapping ────────────────────────────────────────
export const reviewMappingSchema = z.object({
  mappingId: z.string().uuid(),
  status: z.enum(["APPROVED", "RETURNED", "UNDER_REVIEW"]),
  remarks: z.string().optional(),
})

export type ReviewMappingInput = z.infer<typeof reviewMappingSchema>
