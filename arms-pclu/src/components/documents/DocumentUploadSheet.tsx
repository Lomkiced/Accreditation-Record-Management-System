"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Check,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  Tag,
  Upload,
  X,
  Search,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileUploadZone } from "@/components/shared/FileUploadZone"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { uploadDocument, createEvidenceMappings } from "@/actions/document.actions"
import { getIndicatorsForSelector } from "@/actions/document.actions"
import type { DocumentWithMappings } from "@/types/document.types"

// ─── Types ────────────────────────────────────────────────────────────────────

type AreaNode = {
  id: string
  name: string
  order: number
  criteria: CriterionNode[]
}

type CriterionNode = {
  id: string
  name: string
  order: number
  indicators: IndicatorNode[]
}

type IndicatorNode = {
  id: string
  name: string
  requiredDocs: string | null
  order: number
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const step1Schema = z.object({
  title: z.string().min(1, "Document title is required").max(255),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
})

type Step1Values = z.infer<typeof step1Schema>

// ─── Step Indicator Component ─────────────────────────────────────────────────

function StepBar({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Upload File" },
    { n: 2, label: "Tag Indicators" },
    { n: 3, label: "Review & Submit" },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isDone = current > step.n
        const isActive = current === step.n
        return (
          <React.Fragment key={step.n}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 transition-all duration-200",
                  isDone
                    ? "bg-emerald-500 ring-emerald-500 text-white"
                    : isActive
                      ? "bg-blue-600 ring-blue-600 text-white"
                      : "bg-white ring-slate-200 text-slate-400"
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.n}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium mt-1 whitespace-nowrap",
                  isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-300",
                  current > step.n ? "bg-emerald-400" : "bg-slate-200"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DocumentUploadSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: (documentId: string) => void
  initialDocument?: DocumentWithMappings | null
}

export function DocumentUploadSheet({
  open,
  onClose,
  onSuccess,
  initialDocument,
}: DocumentUploadSheetProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [uploadedDocumentId, setUploadedDocumentId] = React.useState<string | null>(null)
  const [selectedIndicatorIds, setSelectedIndicatorIds] = React.useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [areaTree, setAreaTree] = React.useState<AreaNode[]>([])
  const [loadingTree, setLoadingTree] = React.useState(false)
  const [indicatorSearch, setIndicatorSearch] = React.useState("")

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { title: "", description: "", documentDate: "" },
  })

  // Load the area/indicator tree when the sheet opens
  React.useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoadingTree(true)
      const result = await getIndicatorsForSelector()
      if (result.success && result.data) {
        setAreaTree(result.data)
      }
      setLoadingTree(false)
    }
    load()
  }, [open])

  // Initialize draft state if initialDocument is provided
  React.useEffect(() => {
    if (open && initialDocument) {
      setUploadedDocumentId(initialDocument.id)
      setStep(2)
      // Pre-populate indicators from existing mappings
      const existingIds = new Set(initialDocument.mappings.map(m => m.indicator.id))
      setSelectedIndicatorIds(existingIds)
      
      // Also pre-fill form just in case we need it for Step 3 summary
      form.setValue("title", initialDocument.title)
      form.setValue("description", initialDocument.description ?? "")
      form.setValue("documentDate", initialDocument.documentDate ? new Date(initialDocument.documentDate).toISOString().split('T')[0] : "")
    }
  }, [open, initialDocument, form])

  const handleClose = () => {
    form.reset()
    setStep(1)
    setSelectedFile(null)
    setUploadedDocumentId(null)
    setSelectedIndicatorIds(new Set())
    setIndicatorSearch("")
    onClose()
  }

  // ─── Step 1: Upload document record ────────────────────────────────────────
  const handleStep1Submit = async (values: Step1Values) => {
    if (!selectedFile) {
      toast.error("Please attach a document file.")
      return
    }
    setIsSaving(true)
    try {
      // TODO: In production, upload to Supabase Storage first and get the URL.
      // For now, we pass filename metadata and store the file reference.
      const result = await uploadDocument({
        title: values.title,
        description: values.description,
        documentDate: values.documentDate,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        // fileUrl: supabaseStorageUrl (set after actual storage upload)
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setUploadedDocumentId(result.data!.documentId)
      setStep(2)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Step 2: Toggle indicator selection ────────────────────────────────────
  const toggleIndicator = (id: string) => {
    setSelectedIndicatorIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllInCriterion = (criterion: CriterionNode) => {
    const ids = criterion.indicators.map((i) => i.id)
    const allSelected = ids.every((id) => selectedIndicatorIds.has(id))
    setSelectedIndicatorIds((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  // ─── Step 3: Create M:N mappings and submit ─────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!uploadedDocumentId) return
    if (selectedIndicatorIds.size === 0) {
      toast.error("Please select at least one indicator to tag.")
      return
    }
    setIsSubmitting(true)
    try {
      const result = await createEvidenceMappings({
        documentId: uploadedDocumentId,
        indicatorIds: Array.from(selectedIndicatorIds),
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(
        `Document tagged to ${result.data!.createdCount} indicator(s) and saved as Draft. Submit for review from My Submissions.`
      )
      onSuccess?.(uploadedDocumentId)
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Filtered tree for search ──────────────────────────────────────────────
  const filteredTree = React.useMemo(() => {
    if (!indicatorSearch.trim()) return areaTree
    const q = indicatorSearch.toLowerCase()
    return areaTree
      .map((area) => ({
        ...area,
        criteria: area.criteria
          .map((crit) => ({
            ...crit,
            indicators: crit.indicators.filter(
              (ind) =>
                ind.name.toLowerCase().includes(q) ||
                crit.name.toLowerCase().includes(q) ||
                area.name.toLowerCase().includes(q)
            ),
          }))
          .filter((crit) => crit.indicators.length > 0),
      }))
      .filter((area) => area.criteria.length > 0)
  }, [areaTree, indicatorSearch])

  // ─── Summary data for Step 3 ───────────────────────────────────────────────
  const selectedIndicatorDetails = React.useMemo(() => {
    return areaTree.flatMap((area) =>
      area.criteria.flatMap((crit) =>
        crit.indicators
          .filter((ind) => selectedIndicatorIds.has(ind.id))
          .map((ind) => ({
            indicatorId: ind.id,
            indicatorName: ind.name,
            criterionName: crit.name,
            areaName: area.name,
          }))
      )
    )
  }, [areaTree, selectedIndicatorIds])

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-[560px] sm:max-w-[560px] p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Upload Evidence Document
            </SheetTitle>
          </div>
          <StepBar current={step} />
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Step 1: File upload & metadata ── */}
          {step === 1 && (
            <div className="px-6 py-5 space-y-5">
              {/* File Upload */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Document File <span className="text-red-500">*</span>
                </Label>
                <FileUploadZone
                  onFileSelect={setSelectedFile}
                  accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                  maxSize={25 * 1024 * 1024}
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-blue-800 font-medium truncate flex-1">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-blue-500 shrink-0">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-400 hover:text-red-400 transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <form
                id="step1-form"
                onSubmit={form.handleSubmit(handleStep1Submit)}
                className="space-y-4"
              >
                {/* Title */}
                <div>
                  <Label htmlFor="doc-title" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Document Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="doc-title"
                    placeholder="e.g., Faculty TOR — Dr. Juan Dela Cruz"
                    {...form.register("title")}
                    className={cn(
                      form.formState.errors.title && "border-red-400 focus-visible:ring-red-400"
                    )}
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="doc-description" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Description{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="doc-description"
                    placeholder="Add any notes for the reviewer..."
                    rows={3}
                    {...form.register("description")}
                    className="resize-none"
                  />
                </div>

                {/* Document Date */}
                <div>
                  <Label htmlFor="doc-date" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Document Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="doc-date"
                    type="date"
                    {...form.register("documentDate")}
                    className={cn(
                      form.formState.errors.documentDate && "border-red-400 focus-visible:ring-red-400"
                    )}
                  />
                  {form.formState.errors.documentDate && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {form.formState.errors.documentDate.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ── Step 2: Indicator Tagging ── */}
          {step === 2 && (
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Tag className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  Select the indicators this document provides evidence for. You can tag it to{" "}
                  <strong>multiple indicators</strong> across different areas.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="indicator-search"
                  placeholder="Search indicators..."
                  value={indicatorSearch}
                  onChange={(e) => setIndicatorSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Selected count badge */}
              {selectedIndicatorIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 border-blue-200"
                  >
                    {selectedIndicatorIds.size} indicator
                    {selectedIndicatorIds.size > 1 ? "s" : ""} selected
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setSelectedIndicatorIds(new Set())}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {loadingTree ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-500">Loading indicators...</span>
                </div>
              ) : filteredTree.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No indicators match your search.
                </div>
              ) : (
                <ScrollArea className="h-[380px] -mx-2 px-2">
                  <Accordion type="multiple" className="space-y-2">
                    {filteredTree.map((area, aIdx) => {
                      const areaColors = [
                        "bg-blue-500", "bg-violet-500", "bg-emerald-500",
                        "bg-amber-500", "bg-rose-500", "bg-cyan-500",
                        "bg-orange-500", "bg-teal-500",
                      ]
                      const colorClass = areaColors[aIdx % areaColors.length]

                      return (
                        <AccordionItem
                          key={area.id}
                          value={area.id}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 hover:no-underline [&[data-state=open]]:bg-slate-50">
                            <div className="flex items-center gap-3 text-left">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                                  colorClass
                                )}
                              >
                                {aIdx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {area.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {area.criteria.reduce(
                                    (acc, c) => acc + c.indicators.length,
                                    0
                                  )}{" "}
                                  indicators
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-0 pt-0 pb-0">
                            <div className="divide-y divide-slate-100">
                              {area.criteria.map((criterion) => {
                                const allSelected = criterion.indicators.every(
                                  (i) => selectedIndicatorIds.has(i.id)
                                )
                                const someSelected = criterion.indicators.some(
                                  (i) => selectedIndicatorIds.has(i.id)
                                )
                                return (
                                  <div key={criterion.id} className="px-4 py-3">
                                    {/* Criterion header with select-all */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <Checkbox
                                        id={`crit-${criterion.id}`}
                                        checked={allSelected}
                                        data-indeterminate={someSelected && !allSelected}
                                        onCheckedChange={() =>
                                          toggleAllInCriterion(criterion)
                                        }
                                        className={cn(
                                          someSelected && !allSelected && "opacity-60"
                                        )}
                                      />
                                      <label
                                        htmlFor={`crit-${criterion.id}`}
                                        className="text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors select-none"
                                      >
                                        {criterion.name}
                                      </label>
                                    </div>
                                    {/* Indicators */}
                                    <div className="ml-6 space-y-1.5">
                                      {criterion.indicators.map((indicator) => (
                                        <div
                                          key={indicator.id}
                                          className={cn(
                                            "flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer",
                                            selectedIndicatorIds.has(indicator.id)
                                              ? "bg-blue-50 border border-blue-200"
                                              : "hover:bg-slate-50 border border-transparent"
                                          )}
                                          onClick={() => toggleIndicator(indicator.id)}
                                        >
                                          <Checkbox
                                            id={`ind-${indicator.id}`}
                                            checked={selectedIndicatorIds.has(indicator.id)}
                                            onCheckedChange={() =>
                                              toggleIndicator(indicator.id)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-0.5 shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <label
                                              htmlFor={`ind-${indicator.id}`}
                                              className="text-sm text-slate-700 cursor-pointer select-none leading-snug"
                                            >
                                              {indicator.name}
                                            </label>
                                            {indicator.requiredDocs && (
                                              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                                {indicator.requiredDocs}
                                              </p>
                                            )}
                                          </div>
                                          {selectedIndicatorIds.has(indicator.id) && (
                                            <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                          )}
                                        </div>
                                      ))}
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

          {/* ── Step 3: Review & Confirm ── */}
          {step === 3 && (
            <div className="px-6 py-5 space-y-5">
              {/* Document summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Document Details
                </h4>
                <div className="space-y-1.5">
                  <div className="flex gap-3">
                    <span className="text-xs text-slate-400 w-20 shrink-0">Title</span>
                    <span className="text-sm font-medium text-slate-800 flex-1">
                      {form.getValues("title")}
                    </span>
                  </div>
                  {form.getValues("description") && (
                    <div className="flex gap-3">
                      <span className="text-xs text-slate-400 w-20 shrink-0">Description</span>
                      <span className="text-sm text-slate-600 flex-1">
                        {form.getValues("description")}
                      </span>
                    </div>
                  )}
                  {selectedFile && (
                    <div className="flex gap-3">
                      <span className="text-xs text-slate-400 w-20 shrink-0">File</span>
                      <span className="text-sm text-slate-600 flex-1 truncate">
                        {selectedFile.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator mappings summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Tagged to {selectedIndicatorIds.size} Indicator
                  {selectedIndicatorIds.size !== 1 ? "s" : ""}
                </h4>
                <ScrollArea className="max-h-[280px]">
                  <div className="space-y-2">
                    {selectedIndicatorDetails.map((detail) => (
                      <div
                        key={detail.indicatorId}
                        className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-400">
                            {detail.areaName} → {detail.criterionName}
                          </p>
                          <p className="text-sm font-medium text-slate-800 leading-snug mt-0.5">
                            {detail.indicatorName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Note about draft status */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  The document will be saved as <strong>Draft</strong>. Go to{" "}
                  <em>My Submissions</em> to review and officially submit each
                  mapping for admin review.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            {/* Back button */}
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                disabled={isSubmitting || isSaving}
                className="flex-1"
              >
                Back
              </Button>
            )}

            {/* Step 1: Next */}
            {step === 1 && (
              <Button
                type="submit"
                form="step1-form"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next: Tag Indicators
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}

            {/* Step 2: Next */}
            {step === 2 && (
              <Button
                type="button"
                onClick={() => {
                  if (selectedIndicatorIds.size === 0) {
                    toast.error("Select at least one indicator to continue.")
                    return
                  }
                  setStep(3)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Review & Confirm
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {/* Step 3: Final submit */}
            {step === 3 && (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving Mappings...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
