import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, FileText, Upload, Layers } from "lucide-react"
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
import { cn, formatFileSize } from "@/lib/utils"
import { toast } from "sonner"
import { uploadFileToStorage } from "@/lib/supabase/storage"
import { useSubmitDocument, useSubmitBatchDocuments, useSaveDraft } from "@/hooks/useSubmissions"
import { useAuth } from "@/hooks/useAuth"

const SubmissionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null)

  const { user } = useAuth()
  const submitDocument = useSubmitDocument()
  const submitBatchDocuments = useSubmitBatchDocuments()
  const saveDraft = useSaveDraft()

  const isApproved = existingSubmission?.status === "APPROVED"

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(SubmissionSchema),
    defaultValues: {
      title: existingSubmission?.title ?? "",
      description: existingSubmission?.description ?? "",
      documentDate: new Date().toISOString().split("T")[0],
    },
  })

  // Sync form values when existingSubmission changes
  useEffect(() => {
    if (existingSubmission) {
      form.reset({
        title: existingSubmission.title ?? "",
        description: existingSubmission.description ?? "",
        documentDate: new Date().toISOString().split("T")[0],
      })
      setSelectedFiles([])
    } else {
      form.reset({
        title: "",
        description: "",
        documentDate: new Date().toISOString().split("T")[0],
      })
      setSelectedFiles([])
    }
  }, [existingSubmission, form, open])

  const handleClose = () => {
    form.reset()
    setSelectedFiles([])
    setUploadProgress(0)
    setUploadingItemIndex(null)
    onClose()
  }

  const handleFilesChosen = (files: File[]) => {
    if (existingSubmission) {
      // Single file replacement when updating
      setSelectedFiles(files.slice(0, 1))
    } else {
      setSelectedFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name))
        const newFiles = files.filter((f) => !existingNames.has(f.name))
        const combined = [...prev, ...newFiles]
        // Auto-fill title if empty and only 1 file
        if (combined.length === 1 && !form.getValues("title")) {
          const defaultTitle = combined[0].name.replace(/\.[^/.]+$/, "")
          form.setValue("title", defaultTitle)
        }
        return combined
      })
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ─── Save as Draft ───────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    const values = form.getValues()
    const title = values.title || (selectedFiles[0] ? selectedFiles[0].name.replace(/\.[^/.]+$/, "") : "")
    if (!title) {
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

    let fileMeta: { fileUrl: string; fileName: string; fileSize: number } | null = null
    if (selectedFiles[0]) {
      setIsUploading(true)
      try {
        fileMeta = await uploadFileToStorage(selectedFiles[0], user!.id, (pct) => setUploadProgress(pct))
      } catch (err) {
        toast.error("File upload failed")
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    const result = await saveDraft.mutateAsync({
      indicatorId: indicator.id,
      title: title,
      description: values.description || undefined,
      documentDate: values.documentDate,
      fileUrl: fileMeta?.fileUrl,
      fileName: fileMeta?.fileName,
      fileSize: fileMeta?.fileSize,
    })

    if (result?.success) handleClose()
  }

  // ─── Submit for Review ───────────────────────────────────────────────────────
  const handleSubmit = async (values: SubmissionFormValues) => {
    if (!selectedFiles.length && !existingSubmission) {
      toast.error("Please attach at least one document file.")
      return
    }
    if (!indicator) {
      toast.error("No indicator selected.")
      return
    }
    if (!user?.id) {
      toast.error("Authentication required. Please log in.")
      return
    }

    // SCENARIO 1: Updating an existing submission (Single file update in-place)
    if (existingSubmission) {
      let fileMeta: { fileUrl: string; fileName: string; fileSize: number } | null = null

      if (selectedFiles[0]) {
        setIsUploading(true)
        try {
          fileMeta = await uploadFileToStorage(
            selectedFiles[0],
            user.id,
            (pct) => setUploadProgress(pct)
          )
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "File upload failed.")
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      if (!fileMeta) {
        toast.error("Please attach an updated document file.")
        return
      }

      const result = await submitDocument.mutateAsync({
        indicatorId: indicator.id,
        documentId: existingSubmission.id, // Update in-place!
        title: values.title?.trim() || existingSubmission.title,
        description: values.description?.trim() || undefined,
        documentDate: values.documentDate,
        fileUrl: fileMeta.fileUrl,
        fileName: fileMeta.fileName,
        fileSize: fileMeta.fileSize,
      })

      if (result?.success) handleClose()
      return
    }

    // SCENARIO 2: Single file new submission
    if (selectedFiles.length === 1) {
      const file = selectedFiles[0]
      const title = values.title?.trim() || file.name.replace(/\.[^/.]+$/, "")

      setIsUploading(true)
      let fileMeta: { fileUrl: string; fileName: string; fileSize: number } | null = null
      try {
        fileMeta = await uploadFileToStorage(file, user.id, (pct) => setUploadProgress(pct))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "File upload failed.")
        setIsUploading(false)
        return
      }
      setIsUploading(false)

      if (!fileMeta) {
        toast.error("A file is required to submit.")
        return
      }

      const result = await submitDocument.mutateAsync({
        indicatorId: indicator.id,
        title,
        description: values.description?.trim() || undefined,
        documentDate: values.documentDate,
        fileUrl: fileMeta.fileUrl,
        fileName: fileMeta.fileName,
        fileSize: fileMeta.fileSize,
      })

      if (result?.success) handleClose()
      return
    }

    // SCENARIO 3: Batch upload multiple files concurrently / sequentially
    if (selectedFiles.length > 1) {
      setIsUploading(true)
      const uploadedMetas: Array<{
        title: string
        description?: string
        fileUrl: string
        fileName: string
        fileSize: number
      }> = []

      try {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          setUploadingItemIndex(i)
          setUploadProgress(Math.round(((i) / selectedFiles.length) * 100))

          const meta = await uploadFileToStorage(file, user.id, (pct) => {
            const step = 100 / selectedFiles.length
            const currentTotal = Math.round((i * step) + (pct * (step / 100)))
            setUploadProgress(currentTotal)
          })

          uploadedMetas.push({
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: values.description?.trim() || undefined,
            fileUrl: meta.fileUrl,
            fileName: meta.fileName,
            fileSize: meta.fileSize,
          })
        }
        setUploadProgress(100)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload files.")
        setIsUploading(false)
        setUploadingItemIndex(null)
        return
      } finally {
        setIsUploading(false)
        setUploadingItemIndex(null)
      }

      const result = await submitBatchDocuments.mutateAsync({
        indicatorId: indicator.id,
        documentDate: values.documentDate,
        files: uploadedMetas,
      })

      if (result?.success) handleClose()
    }
  }

  const isPending =
    isUploading || submitDocument.isPending || submitBatchDocuments.isPending || saveDraft.isPending

  const isBatch = !existingSubmission && selectedFiles.length > 1

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-[540px] sm:max-w-[540px] overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-slate-900 leading-tight">
                {existingSubmission ? "Update Evidence Document" : indicator?.name ?? "Upload Evidence"}
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
                Required Document(s)
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

          {/* File upload zone */}
          {!isApproved && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-slate-700">
                  {existingSubmission ? "Attach Updated File" : "Select Document(s)"}
                  {!existingSubmission && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {!existingSubmission && (
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Multi-file supported
                  </span>
                )}
              </div>

              <FileUploadZone
                multiple={!existingSubmission}
                onFilesSelect={handleFilesChosen}
                onFileSelect={(file) => {
                  if (file) setSelectedFiles([file])
                  else setSelectedFiles([])
                }}
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                maxSize={25 * 1024 * 1024}
              />

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                    </span>
                    {selectedFiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white overflow-hidden max-h-[160px] overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload progress bar */}
              {isUploading && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between text-xs text-blue-700 font-medium mb-1.5">
                    <span>
                      {uploadingItemIndex !== null
                        ? `Uploading (${uploadingItemIndex + 1}/${selectedFiles.length}): ${selectedFiles[uploadingItemIndex]?.name}`
                        : "Uploading files..."}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-blue-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form fields */}
          {!isApproved && (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Batch upload notification */}
              {isBatch && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Batch Upload Mode</p>
                  <p className="mt-0.5">
                    Each of the {selectedFiles.length} files will be submitted as an individual evidence document. Titles default to filenames.
                  </p>
                </div>
              )}

              {/* Document Title (for single file or update) */}
              {!isBatch && (
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
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Description / Remarks
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes for the reviewer..."
                  rows={2}
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
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      {isUploading
                        ? `Uploading (${uploadProgress}%)...`
                        : "Submitting..."}
                    </>
                  ) : existingSubmission ? (
                    "Save & Resubmit Update"
                  ) : isBatch ? (
                    `Submit ${selectedFiles.length} Documents for Review`
                  ) : (
                    "Submit for Review"
                  )}
                </Button>

                {!existingSubmission && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isPending || selectedFiles.length > 1}
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
                )}
              </div>
            </form>
          )}

          {/* Version history */}
          {existingSubmission && existingSubmission.versions?.length > 0 && (
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
