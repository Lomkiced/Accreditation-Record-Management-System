import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  X,
  FileText,
  Upload,
  Layers,
  Link2,
  Search,
  Check,
  Lock,
  ChevronDown,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
  useSubmitDocument,
  useSubmitBatchDocuments,
  useSaveDraft,
  submissionKeys,
} from "@/hooks/useSubmissions"
import { useAuth } from "@/hooks/useAuth"
import { StorageMeter } from "@/components/shared/StorageMeter"
import { useMyStorageQuota, storageQuotaKeys } from "@/hooks/useStorageQuota"
import { areaKeys } from "@/hooks/useAreas"
import { dashboardKeys } from "@/hooks/useDashboard"
import { checkDuplicateEvidenceAction } from "@/actions/storage.actions"
import { getIndicatorsForSelector } from "@/actions/document.actions"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

// ─── Hierarchy Types ─────────────────────────────────────────────────────────

type AreaNode = {
  id: string
  name: string
  order: number
  assignedFaculty?: string[]
  criteria: CriterionNode[]
}

type CriterionNode = {
  id: string
  name: string
  order: number
  assignedFaculty?: string[]
  indicators: IndicatorNode[]
}

type IndicatorNode = {
  id: string
  name: string
  requiredDocs: string | null
  order: number
}

// ─── Zod Schema ──────────────────────────────────────────────────────────────

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

  // Cross-Area / Indicator Linking State
  const [selectedAdditionalIds, setSelectedAdditionalIds] = useState<Set<string>>(new Set())
  const [areaTree, setAreaTree] = useState<AreaNode[]>([])
  const [loadingTree, setLoadingTree] = useState(false)
  const [indicatorSearch, setIndicatorSearch] = useState("")
  const [isLinkingExpanded, setIsLinkingExpanded] = useState(false)

  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const submitDocument = useSubmitDocument()
  const submitBatchDocuments = useSubmitBatchDocuments()
  const saveDraft = useSaveDraft()
  const { data: storageQuota, isLoading: isLoadingQuota } = useMyStorageQuota()

  const isApproved = existingSubmission?.status === "APPROVED"

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(SubmissionSchema),
    defaultValues: {
      title: existingSubmission?.title ?? "",
      description: existingSubmission?.description ?? "",
      documentDate: new Date().toISOString().split("T")[0],
    },
  })

  // Load the full area/indicator tree when sheet opens for cross-area tagging
  useEffect(() => {
    if (!open) return
    let isMounted = true
    const load = async () => {
      setLoadingTree(true)
      try {
        const result = await getIndicatorsForSelector()
        if (isMounted && result.success && result.data) {
          setAreaTree(result.data)
        }
      } catch (err) {
        console.error("Failed to load indicators for selector", err)
      } finally {
        if (isMounted) setLoadingTree(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [open])

  // Sync form values when existingSubmission changes
  useEffect(() => {
    if (existingSubmission) {
      form.reset({
        title: existingSubmission.title ?? "",
        description: existingSubmission.description ?? "",
        documentDate: new Date().toISOString().split("T")[0],
      })
      setSelectedFiles([])
      setSelectedAdditionalIds(new Set())
    } else {
      form.reset({
        title: "",
        description: "",
        documentDate: new Date().toISOString().split("T")[0],
      })
      setSelectedFiles([])
      setSelectedAdditionalIds(new Set())
    }
  }, [existingSubmission, form, open])

  const handleClose = () => {
    form.reset()
    setSelectedFiles([])
    setUploadProgress(0)
    setUploadingItemIndex(null)
    setSelectedAdditionalIds(new Set())
    setIndicatorSearch("")
    setIsLinkingExpanded(false)
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

  // ─── Toggle Indicator Handlers ───────────────────────────────────────────────
  const toggleAdditionalIndicator = (id: string) => {
    if (indicator && id === indicator.id) return // Primary target is locked
    setSelectedAdditionalIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllInCriterion = (criterion: CriterionNode) => {
    const selectable = criterion.indicators.filter((i) => i.id !== indicator?.id)
    const ids = selectable.map((i) => i.id)
    const allSelected = ids.every((id) => selectedAdditionalIds.has(id))
    setSelectedAdditionalIds((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  // Filtered hierarchy for search
  const filteredTree = useMemo(() => {
    const q = indicatorSearch.trim().toLowerCase()
    return areaTree
      .map((area) => ({
        ...area,
        criteria: area.criteria
          .map((crit) => ({
            ...crit,
            indicators: q
              ? crit.indicators.filter(
                  (ind) =>
                    ind.name.toLowerCase().includes(q) ||
                    crit.name.toLowerCase().includes(q) ||
                    area.name.toLowerCase().includes(q)
                )
              : crit.indicators,
          }))
          .filter((crit) => crit.indicators.length > 0),
      }))
      .filter((area) => area.criteria.length > 0)
  }, [areaTree, indicatorSearch])

  // Flat summary details of selected additional indicators for removable pills
  const selectedAdditionalDetails = useMemo(() => {
    return areaTree.flatMap((area) =>
      area.criteria.flatMap((crit) =>
        crit.indicators
          .filter((ind) => selectedAdditionalIds.has(ind.id) && ind.id !== indicator?.id)
          .map((ind) => ({
            indicatorId: ind.id,
            indicatorName: ind.name,
            criterionName: crit.name,
            areaName: area.name,
          }))
      )
    )
  }, [areaTree, selectedAdditionalIds, indicator?.id])

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

    // Pre-check duplicate title before saving draft
    const duplicateCheck = await checkDuplicateEvidenceAction({
      indicatorId: indicator.id,
      title: title,
      excludeDocumentId: existingSubmission?.id,
    })
    if (duplicateCheck.data?.isDuplicate) {
      toast.error("Duplicate file detected. This document already exists.")
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

    const additionalIds = Array.from(selectedAdditionalIds)

    const result = await saveDraft.mutateAsync({
      indicatorId: indicator.id,
      title: title,
      description: values.description || undefined,
      documentDate: values.documentDate,
      fileUrl: fileMeta?.fileUrl,
      fileName: fileMeta?.fileName,
      fileSize: fileMeta?.fileSize,
      additionalIndicatorIds: additionalIds.length > 0 ? additionalIds : undefined,
    })

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
      queryClient.invalidateQueries({ queryKey: areaKeys.all })
      queryClient.invalidateQueries({ queryKey: storageQuotaKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
      router.refresh()
      handleClose()
    }
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

    // Pre-check storage quota guardrail
    const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0)
    if (storageQuota && storageQuota.usedBytes + totalBytes > storageQuota.quotaBytes) {
      toast.error(
        `Storage limit exceeded. Available: ${storageQuota.availableMB} MB / Limit: ${storageQuota.quotaMB} MB.`
      )
      return
    }

    const additionalIds = Array.from(selectedAdditionalIds)

    // SCENARIO 1: Updating an existing submission (Single file update in-place)
    if (existingSubmission) {
      const targetTitle = values.title?.trim() || existingSubmission.title

      // Pre-check duplicate title
      const dupCheck = await checkDuplicateEvidenceAction({
        indicatorId: indicator.id,
        title: targetTitle,
        excludeDocumentId: existingSubmission.id,
      })
      if (dupCheck.data?.isDuplicate) {
        toast.error("Duplicate file detected. This document already exists.")
        return
      }

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
        additionalIndicatorIds: additionalIds.length > 0 ? additionalIds : undefined,
      })

      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
        queryClient.invalidateQueries({ queryKey: areaKeys.all })
        queryClient.invalidateQueries({ queryKey: storageQuotaKeys.all })
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        router.refresh()
        handleClose()
      }
      return
    }

    // SCENARIO 2: Single file new submission
    if (selectedFiles.length === 1) {
      const file = selectedFiles[0]
      const title = values.title?.trim() || file.name.replace(/\.[^/.]+$/, "")

      // Pre-check duplicate title
      const dupCheck = await checkDuplicateEvidenceAction({
        indicatorId: indicator.id,
        title,
      })
      if (dupCheck.data?.isDuplicate) {
        toast.error("Duplicate file detected. This document already exists.")
        return
      }

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
        additionalIndicatorIds: additionalIds.length > 0 ? additionalIds : undefined,
      })

      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
        queryClient.invalidateQueries({ queryKey: areaKeys.all })
        queryClient.invalidateQueries({ queryKey: storageQuotaKeys.all })
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        router.refresh()
        handleClose()
      }
      return
    }

    // SCENARIO 3: Batch upload multiple files concurrently / sequentially
    if (selectedFiles.length > 1) {
      // 1. Intra-batch duplicate check
      const batchTitles = selectedFiles.map((f) =>
        (f.name.replace(/\.[^/.]+$/, "")).trim().toLowerCase()
      )
      if (new Set(batchTitles).size !== batchTitles.length) {
        toast.error("Duplicate file detected. This document already exists.")
        return
      }

      // 2. Pre-check each file against indicator
      for (const file of selectedFiles) {
        const itemTitle = file.name.replace(/\.[^/.]+$/, "")
        const dupCheck = await checkDuplicateEvidenceAction({
          indicatorId: indicator.id,
          title: itemTitle,
        })
        if (dupCheck.data?.isDuplicate) {
          toast.error("Duplicate file detected. This document already exists.")
          return
        }
      }

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
        additionalIndicatorIds: additionalIds.length > 0 ? additionalIds : undefined,
      })

      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: submissionKeys.mine })
        queryClient.invalidateQueries({ queryKey: areaKeys.all })
        queryClient.invalidateQueries({ queryKey: storageQuotaKeys.all })
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        router.refresh()
        handleClose()
      }
    }
  }

  const isPending =
    isUploading || submitDocument.isPending || submitBatchDocuments.isPending || saveDraft.isPending

  const isBatch = !existingSubmission && selectedFiles.length > 1

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-[560px] sm:max-w-[560px] overflow-y-auto p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 shrink-0">
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

        <div className="px-6 py-5 space-y-5 flex-1">
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

          {/* Storage Quota Meter */}
          {!isApproved && (
            <StorageMeter
              quota={storageQuota}
              isLoading={isLoadingQuota}
              compact
              className="border-slate-200"
            />
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
                accept=".pdf,application/pdf"
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
                    {selectedAdditionalIds.size > 0 && (
                      <span className="block mt-1 font-medium text-blue-700">
                        + Each file will also be linked to the {selectedAdditionalIds.size} selected additional indicator(s).
                      </span>
                    )}
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

              {/* ─── PRIMARY TARGET INDICATOR CARD ─── */}
              {indicator && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      Primary Target Indicator
                    </span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold">
                      Current Area
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {areaName} → {criterionName}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {indicator.name}
                  </p>
                </div>
              )}

              {/* ─── CROSS-AREA / MULTI-INDICATOR LINKING SECTION ─── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {/* Header toggle button */}
                <button
                  type="button"
                  onClick={() => setIsLinkingExpanded((prev) => !prev)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">
                          Cross-Area / Indicator Linking
                        </p>
                        {selectedAdditionalIds.size > 0 ? (
                          <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] px-2 py-0.2">
                            +{selectedAdditionalIds.size} Linked
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">
                            (Optional)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Tag this evidence to other areas across the institution
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2",
                      isLinkingExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Expanded content */}
                {isLinkingExpanded && (
                  <div className="p-4 border-t border-slate-100 space-y-3.5 bg-slate-50/50">
                    {/* Informational Callout */}
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">
                        Select additional indicators to link. Linked copies will be created as <strong>Draft</strong> in target areas with <strong>single-deduction storage</strong> (0 MB added to Area Owners).
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="additional-indicator-search"
                        placeholder="Search areas, criteria, or indicators..."
                        value={indicatorSearch}
                        onChange={(e) => setIndicatorSearch(e.target.value)}
                        className="pl-9 h-9 text-xs bg-white"
                      />
                    </div>

                    {/* Selected Badges / Removable Pills */}
                    {selectedAdditionalDetails.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            Linked to {selectedAdditionalDetails.length} additional indicator{selectedAdditionalDetails.length > 1 ? "s" : ""}:
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedAdditionalIds(new Set())}
                            className="text-slate-400 hover:text-red-500 transition-colors text-[11px]"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                          {selectedAdditionalDetails.map((detail) => (
                            <span
                              key={detail.indicatorId}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[11px] font-medium"
                            >
                              <span className="text-blue-950 font-semibold">{detail.areaName}:</span>
                              <span className="truncate max-w-[150px]">{detail.indicatorName}</span>
                              <button
                                type="button"
                                onClick={() => toggleAdditionalIndicator(detail.indicatorId)}
                                className="text-blue-400 hover:text-red-500 transition-colors ml-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hierarchical Accordion Picker */}
                    {loadingTree ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        <span className="ml-2 text-xs text-slate-500">Loading indicators...</span>
                      </div>
                    ) : filteredTree.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                        No indicators match your search.
                      </div>
                    ) : (
                      <ScrollArea className="h-[280px] bg-white rounded-lg border border-slate-200 p-2">
                        <Accordion type="multiple" className="space-y-2">
                          {filteredTree.map((area, aIdx) => {
                            const areaColors = [
                              "bg-blue-500", "bg-indigo-500", "bg-emerald-500",
                              "bg-amber-500", "bg-rose-500", "bg-cyan-500",
                              "bg-orange-500", "bg-teal-500",
                            ]
                            const colorClass = areaColors[aIdx % areaColors.length]
                            const isCurrentArea = area.criteria.some((c) =>
                              c.indicators.some((ind) => ind.id === indicator?.id)
                            )

                            return (
                              <AccordionItem
                                key={area.id}
                                value={area.id}
                                className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs"
                              >
                                <AccordionTrigger className="px-3 py-2.5 hover:bg-slate-50 hover:no-underline [&[data-state=open]]:bg-slate-50 text-left">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0",
                                        colorClass
                                      )}
                                    >
                                      {aIdx + 1}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-semibold text-slate-800 truncate">
                                          {area.name}
                                        </p>
                                        {isCurrentArea && (
                                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                                            Current
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pt-0 pb-0">
                                  <div className="divide-y divide-slate-100 bg-slate-50/30">
                                    {area.criteria.map((criterion) => {
                                      const selectableIndicators = criterion.indicators.filter(
                                        (i) => i.id !== indicator?.id
                                      )
                                      const allSelected =
                                        selectableIndicators.length > 0 &&
                                        selectableIndicators.every((i) =>
                                          selectedAdditionalIds.has(i.id)
                                        )
                                      const someSelected = selectableIndicators.some((i) =>
                                        selectedAdditionalIds.has(i.id)
                                      )

                                      return (
                                        <div key={criterion.id} className="px-3 py-2">
                                          {/* Criterion header with select-all */}
                                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            {selectableIndicators.length > 0 && (
                                              <Checkbox
                                                id={`form-crit-${criterion.id}`}
                                                checked={allSelected}
                                                data-indeterminate={someSelected && !allSelected}
                                                onCheckedChange={() =>
                                                  toggleAllInCriterion(criterion)
                                                }
                                                className={cn(
                                                  someSelected && !allSelected && "opacity-60",
                                                  "h-3.5 w-3.5"
                                                )}
                                              />
                                            )}
                                            <label
                                              htmlFor={`form-crit-${criterion.id}`}
                                              className="text-[11px] font-semibold text-slate-600 cursor-pointer hover:text-slate-900 select-none"
                                            >
                                              {criterion.name}
                                            </label>
                                            {criterion.assignedFaculty && criterion.assignedFaculty.length > 0 && (
                                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                                {criterion.assignedFaculty.join(", ")}
                                              </span>
                                            )}
                                          </div>

                                          {/* Indicators */}
                                          <div className="ml-5 space-y-1">
                                            {criterion.indicators.map((ind) => {
                                              const isPrimary = ind.id === indicator?.id
                                              const isSelected = selectedAdditionalIds.has(ind.id)

                                              return (
                                                <div
                                                  key={ind.id}
                                                  className={cn(
                                                    "flex items-start gap-2 p-1.5 rounded transition-colors text-xs",
                                                    isPrimary
                                                      ? "bg-slate-100/70 border border-slate-200/60 opacity-80 cursor-not-allowed"
                                                      : isSelected
                                                        ? "bg-blue-50 border border-blue-200 cursor-pointer"
                                                        : "hover:bg-slate-100/60 border border-transparent cursor-pointer"
                                                  )}
                                                  onClick={() => {
                                                    if (!isPrimary) toggleAdditionalIndicator(ind.id)
                                                  }}
                                                >
                                                  <Checkbox
                                                    id={`form-ind-${ind.id}`}
                                                    checked={isPrimary || isSelected}
                                                    disabled={isPrimary}
                                                    onCheckedChange={() => {
                                                      if (!isPrimary) toggleAdditionalIndicator(ind.id)
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mt-0.5 shrink-0 h-3.5 w-3.5"
                                                  />
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                      <label
                                                        htmlFor={`form-ind-${ind.id}`}
                                                        className={cn(
                                                          "cursor-pointer select-none leading-snug text-xs",
                                                          isPrimary
                                                            ? "font-semibold text-slate-600 cursor-not-allowed"
                                                            : isSelected
                                                              ? "font-medium text-blue-900"
                                                              : "text-slate-700"
                                                        )}
                                                      >
                                                        {ind.name}
                                                      </label>
                                                      {isPrimary && (
                                                        <Badge
                                                          variant="outline"
                                                          className="text-[9px] bg-slate-200/80 text-slate-700 border-slate-300 py-0 px-1 font-semibold"
                                                        >
                                                          Primary (Current)
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    {ind.requiredDocs && (
                                                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                        Req: {ind.requiredDocs}
                                                      </p>
                                                    )}
                                                  </div>
                                                  {isSelected && !isPrimary && (
                                                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}
                        </Accordion>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      {isUploading
                        ? `Uploading (${uploadProgress}%)...`
                        : "Submitting..."}
                    </>
                  ) : existingSubmission ? (
                    selectedAdditionalIds.size > 0
                      ? `Save & Link (+${selectedAdditionalIds.size})`
                      : "Save & Resubmit Update"
                  ) : isBatch ? (
                    selectedAdditionalIds.size > 0
                      ? `Submit ${selectedFiles.length} Docs & Link (+${selectedAdditionalIds.size})`
                      : `Submit ${selectedFiles.length} Documents for Review`
                  ) : selectedAdditionalIds.size > 0 ? (
                    `Submit for Review & Link (+${selectedAdditionalIds.size})`
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
                    ) : selectedAdditionalIds.size > 0 ? (
                      `Save as Draft & Link (+${selectedAdditionalIds.size})`
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

// Export alias so either name can be cleanly consumed
export { SubmissionUploadForm as DocumentUploadSheet }
