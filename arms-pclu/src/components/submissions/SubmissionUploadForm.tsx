"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUploadZone } from "@/components/shared/FileUploadZone"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { VersionHistory } from "./VersionHistory"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { uploadFileToStorage } from "@/lib/supabase/storage"
import { useSubmitDocument, useSaveDraft } from "@/hooks/useSubmissions"
import { useAuth } from "@/hooks/useAuth"

const SubmissionSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
  rating: z.number().min(1).max(5).optional(),
})

type SubmissionFormValues = z.infer<typeof SubmissionSchema>

interface SubmissionUploadFormProps {
  open: boolean
  onClose: () => void
  indicator: {
    id: string
    name: string
    requiredDocs: string | null
    ratingScale: number
  } | null
  areaName: string
  criterionName: string
  existingSubmission?: {
    id: string
    title: string
    description: string | null
    status: string
    version: number
    rating: number | null
    versions: Array<{
      version: number
      fileUrl: string
      fileName: string
      createdAt: string
      status: string
      remarks: string | null
    }>
  } | null
}

export function SubmissionUploadForm({
  open,
  onClose,
  indicator,
  areaName,
  criterionName,
  existingSubmission,
}: SubmissionUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedRating, setSelectedRating] = useState<number>(
    existingSubmission?.rating ?? 0
  )
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const { user } = useAuth()
  const submitDocument = useSubmitDocument()
  const saveDraft = useSaveDraft()

  const isApproved = existingSubmission?.status === "APPROVED"

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(SubmissionSchema),
    defaultValues: {
      title: existingSubmission?.title ?? "",
      description: existingSubmission?.description ?? "",
      documentDate: "",
      rating: existingSubmission?.rating ?? undefined,
    },
  })

  const handleClose = () => {
    form.reset()
    setSelectedFile(null)
    setSelectedRating(0)
    setUploadProgress(0)
    onClose()
  }

  // ─── Upload file to Supabase Storage and return metadata ────────────────────
  const resolveFileMetadata = async (): Promise<{
    fileUrl: string
    fileName: string
    fileSize: number
  } | null> => {
    if (!selectedFile) return null
    if (!user?.id) {
      toast.error("Authentication error. Please refresh and try again.")
      return null
    }

    setIsUploading(true)
    try {
      const result = await uploadFileToStorage(
        selectedFile,
        user.id,
        (pct) => setUploadProgress(pct)
      )
      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "File upload failed."
      toast.error(message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // ─── Save as Draft ───────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    const values = form.getValues()
    if (!values.title) {
      form.setError("title", { message: "Title is required even for drafts" })
      return
    }
    if (!values.documentDate) {
      form.setError("documentDate", { message: "Date is required" })
      return
    }
    if (!indicator) {
      toast.error("No indicator selected.")
      return
    }

    // Upload file if one is selected
    const fileMeta = selectedFile ? await resolveFileMetadata() : null
    if (selectedFile && !fileMeta) return // upload failed

    const result = await saveDraft.mutateAsync({
      indicatorId: indicator.id,
      title: values.title,
      description: values.description || undefined,
      documentDate: values.documentDate,
      fileUrl: fileMeta?.fileUrl,
      fileName: fileMeta?.fileName,
      fileSize: fileMeta?.fileSize,
      rating: selectedRating > 0 ? selectedRating : undefined,
    })

    if (result?.success) handleClose()
  }

  // ─── Submit for Review ───────────────────────────────────────────────────────
  const handleSubmit = async (values: SubmissionFormValues) => {
    if (!selectedFile && !existingSubmission) {
      toast.error("Please attach a document file")
      return
    }
    if (!indicator) {
      toast.error("No indicator selected.")
      return
    }

    // Upload file to storage first
    const fileMeta = selectedFile ? await resolveFileMetadata() : null
    if (selectedFile && !fileMeta) return // upload failed

    if (!fileMeta) {
      toast.error("A file is required to submit for review.")
      return
    }

    const result = await submitDocument.mutateAsync({
      indicatorId: indicator.id,
      title: values.title,
      description: values.description || undefined,
      documentDate: values.documentDate,
      fileUrl: fileMeta.fileUrl,
      fileName: fileMeta.fileName,
      fileSize: fileMeta.fileSize,
      rating: selectedRating > 0 ? selectedRating : undefined,
    })

    if (result?.success) handleClose()
  }

  const isPending =
    isUploading || submitDocument.isPending || saveDraft.isPending

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-[520px] sm:max-w-[520px] overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-slate-900 leading-tight">
                {indicator?.name ?? "Upload Evidence"}
              </SheetTitle>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {areaName} → {criterionName}
              </p>
            </div>
            {existingSubmission && (
              <StatusBadge status={existingSubmission.status} size="sm" />
            )}
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Required docs info card */}
          {indicator?.requiredDocs && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Required Document
              </p>
              <p className="text-sm text-blue-800">{indicator.requiredDocs}</p>
            </div>
          )}

          {/* Approved state notice */}
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm font-medium text-emerald-700">
                ✓ This document has been approved.
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                No further action required for this indicator.
              </p>
            </div>
          )}

          {/* Self-survey rating */}
          {!isApproved && (
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Self-Survey Rating
                <span className="text-slate-400 font-normal ml-1">
                  (1–{indicator?.ratingScale ?? 5})
                </span>
              </Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: indicator?.ratingScale ?? 5 }).map(
                  (_, i) => {
                    const rating = i + 1
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setSelectedRating(rating)}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2",
                          "text-sm font-semibold",
                          "transition-all duration-150",
                          selectedRating === rating
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                        )}
                      >
                        {rating}
                      </button>
                    )
                  }
                )}
                {selectedRating > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedRating(0)}
                    className="ml-1 p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selectedRating > 0 && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Selected rating:{" "}
                  <span className="font-semibold text-blue-600">
                    {selectedRating} / {indicator?.ratingScale ?? 5}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* File upload */}
          {!isApproved && (
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                {existingSubmission
                  ? "Attach Updated Document"
                  : "Attach Document"}
                {!existingSubmission && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <FileUploadZone
                onFileSelect={(file) => setSelectedFile(file)}
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                maxSize={25 * 1024 * 1024}
              />
              {/* Upload progress bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form fields */}
          {!isApproved && (
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Document Title */}
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-slate-700 mb-1.5 block"
                >
                  Document Title
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Faculty TOR — Dr. Juan Dela Cruz"
                  {...form.register("title")}
                  className={cn(
                    form.formState.errors.title &&
                      "border-red-400 focus-visible:ring-red-400"
                  )}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700 mb-1.5 block"
                >
                  Description / Remarks
                  <span className="text-slate-400 font-normal ml-1">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes for the admin reviewer..."
                  rows={3}
                  {...form.register("description")}
                  className="resize-none"
                />
              </div>

              {/* Document Date */}
              <div>
                <Label
                  htmlFor="documentDate"
                  className="text-sm font-medium text-slate-700 mb-1.5 block"
                >
                  Document Date
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="documentDate"
                  type="date"
                  {...form.register("documentDate")}
                  className={cn(
                    form.formState.errors.documentDate &&
                      "border-red-400 focus-visible:ring-red-400"
                  )}
                />
                {form.formState.errors.documentDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.documentDate.message}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending && (submitDocument.isPending || isUploading) ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      {isUploading ? "Uploading file..." : "Submitting..."}
                    </>
                  ) : existingSubmission ? (
                    "Resubmit for Review"
                  ) : (
                    "Submit for Review"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isPending}
                  className="w-full"
                >
                  {saveDraft.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Version history */}
          {existingSubmission &&
            existingSubmission.versions.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Submission History
                </p>
                <VersionHistory versions={existingSubmission.versions} />
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
