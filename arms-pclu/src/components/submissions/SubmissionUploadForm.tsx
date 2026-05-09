"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Star } from "lucide-react"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

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
    onClose()
  }

  const handleSaveDraft = async () => {
    const values = form.getValues()
    if (!values.title) {
      form.setError("title", { 
        message: "Title is required even for drafts" 
      })
      return
    }

    setIsSavingDraft(true)
    // TODO: Connect to submission.actions.ts in backend stage
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSavingDraft(false)
    toast.success("Draft saved successfully")
    handleClose()
  }

  const handleSubmit = async (values: SubmissionFormValues) => {
    if (!selectedFile && !existingSubmission) {
      toast.error("Please attach a document file")
      return
    }

    setIsSubmitting(true)
    // TODO: Connect to submission.actions.ts in backend stage
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    toast.success(
      existingSubmission
        ? "Document resubmitted successfully"
        : "Document submitted for review"
    )
    handleClose()
  }

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
              <p className="text-sm text-blue-800">
                {indicator.requiredDocs}
              </p>
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
                {Array.from({ length: indicator?.ratingScale ?? 5 }).map((_, i) => {
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
                })}
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
            </div>
          )}

          {/* Form fields */}
          {!isApproved && (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Document Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Document Title
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Faculty TOR — Dr. Juan Dela Cruz"
                  {...form.register("title")}
                  className={cn(
                    form.formState.errors.title && "border-red-400 focus-visible:ring-red-400"
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
                <Label htmlFor="description" className="text-sm font-medium text-slate-700 mb-1.5 block">
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
                <Label htmlFor="documentDate" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Document Date
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="documentDate"
                  type="date"
                  {...form.register("documentDate")}
                  className={cn(
                    form.formState.errors.documentDate && "border-red-400 focus-visible:ring-red-400"
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
                  disabled={isSubmitting || isSavingDraft}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Submitting...
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
                  disabled={isSubmitting || isSavingDraft}
                  className="w-full"
                >
                  {isSavingDraft ? (
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
          {existingSubmission && existingSubmission.versions.length > 0 && (
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
