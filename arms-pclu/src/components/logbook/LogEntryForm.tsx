"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

const LogEntrySchema = z.object({
  title: z.string().min(1, "Document title is required"),
  date: z.string().min(1, "Date is required"),
  fromTo: z.string().min(1, "This field is required"),
  purpose: z.string().min(1, "Purpose is required"),
  refNo: z.string().optional(),
})

type LogEntryFormValues = z.infer<typeof LogEntrySchema>
type LogbookType = "INCOMING" | "OUTGOING"

interface LogEntryFormProps {
  open: boolean
  onClose: () => void
  editEntry?: {
    id: string
    type: LogbookType
    title: string
    date: string
    fromTo: string
    purpose: string
    refNo: string | null
  } | null
}

export function LogEntryForm({
  open,
  onClose,
  editEntry,
}: LogEntryFormProps) {
  const [selectedType, setSelectedType] =
    useState<LogbookType>(editEntry?.type ?? "INCOMING")
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LogEntryFormValues>({
    resolver: zodResolver(LogEntrySchema),
    defaultValues: {
      title: editEntry?.title ?? "",
      date: editEntry?.date ?? "",
      fromTo: editEntry?.fromTo ?? "",
      purpose: editEntry?.purpose ?? "",
      refNo: editEntry?.refNo ?? "",
    },
  })

  const handleClose = () => {
    form.reset()
    setSelectedFile(null)
    setSelectedType("INCOMING")
    onClose()
  }

  const onSubmit = async (values: LogEntryFormValues) => {
    setIsSubmitting(true)
    // TODO: Connect to logbook.actions.ts in backend stage
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSubmitting(false)
    toast.success(
      editEntry
        ? "Log entry updated successfully"
        : "Log entry submitted for acknowledgment"
    )
    handleClose()
  }

  const isIncoming = selectedType === "INCOMING"

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <SheetTitle className="text-base font-semibold text-slate-900">
            {editEntry ? "Edit Log Entry" : "New Log Entry"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-5">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Type selector */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Document Type
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Incoming */}
                <button
                  type="button"
                  onClick={() => setSelectedType("INCOMING")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer",
                    isIncoming
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isIncoming ? "bg-blue-100" : "bg-slate-100"
                  )}>
                    <ArrowDownLeft className={cn(
                      "w-5 h-5",
                      isIncoming ? "text-blue-600" : "text-slate-400"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-semibold",
                      isIncoming ? "text-blue-700" : "text-slate-600"
                    )}>
                      Incoming
                    </p>
                    <p className="text-xs text-slate-400">Received document</p>
                  </div>
                </button>

                {/* Outgoing */}
                <button
                  type="button"
                  onClick={() => setSelectedType("OUTGOING")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer",
                    !isIncoming
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    !isIncoming ? "bg-emerald-100" : "bg-slate-100"
                  )}>
                    <ArrowUpRight className={cn(
                      "w-5 h-5",
                      !isIncoming ? "text-emerald-600" : "text-slate-400"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-semibold",
                      !isIncoming ? "text-emerald-700" : "text-slate-600"
                    )}>
                      Outgoing
                    </p>
                    <p className="text-xs text-slate-400">Sent document</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Document title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Document Title
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Memorandum No. 2025-001"
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

            {/* Date */}
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Document Date
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
              />
            </div>

            {/* From / To (dynamic label) */}
            <div>
              <Label htmlFor="fromTo" className="text-sm font-medium text-slate-700 mb-1.5 block">
                {isIncoming ? "Received From" : "Sent To"}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="fromTo"
                placeholder={
                  isIncoming
                    ? "e.g., Office of the President"
                    : "e.g., CHED Regional Office"
                }
                {...form.register("fromTo")}
                className={cn(
                  form.formState.errors.fromTo && "border-red-400 focus-visible:ring-red-400"
                )}
              />
              {form.formState.errors.fromTo && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.fromTo.message}
                </p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Purpose
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="purpose"
                placeholder="Briefly describe the purpose of this document..."
                rows={3}
                {...form.register("purpose")}
                className={cn(
                  "resize-none",
                  form.formState.errors.purpose && "border-red-400 focus-visible:ring-red-400"
                )}
              />
              {form.formState.errors.purpose && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.purpose.message}
                </p>
              )}
            </div>

            {/* Reference number */}
            <div>
              <Label htmlFor="refNo" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Reference Number
                <span className="text-slate-400 font-normal ml-1">
                  (optional)
                </span>
              </Label>
              <Input
                id="refNo"
                placeholder="e.g., MEMO-2025-001"
                className="font-mono"
                {...form.register("refNo")}
              />
            </div>

            {/* File attachment */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Attach Scanned Copy
                <span className="text-slate-400 font-normal ml-1">
                  (optional)
                </span>
              </Label>
              <FileUploadZone
                onFileSelect={(file) => setSelectedFile(file)}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={25 * 1024 * 1024}
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : editEntry ? (
                  "Update Entry"
                ) : (
                  "Submit Entry"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
