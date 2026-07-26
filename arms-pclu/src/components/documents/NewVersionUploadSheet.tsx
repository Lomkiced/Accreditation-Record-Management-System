"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import { uploadNewVersion } from "@/actions/document.actions"
import type { DocumentWithMappings } from "@/types/document.types"
import { useAuth } from "@/hooks/useAuth"
import { uploadFileToStorage } from "@/lib/supabase/storage"

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  documentDate: z.string().min(1, "Document date is required"),
})

type FormValues = z.infer<typeof schema>

interface NewVersionUploadSheetProps {
  open: boolean
  onClose: () => void
  document: DocumentWithMappings | null
}

export function NewVersionUploadSheet({
  open,
  onClose,
  document,
}: NewVersionUploadSheetProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number>(0)
  
  const { user } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", documentDate: "" },
  })

  React.useEffect(() => {
    if (open && document) {
      form.reset({
        title: document.title,
        description: document.description ?? "",
        documentDate: new Date(document.documentDate || new Date()).toISOString().split("T")[0],
      })
      setSelectedFile(null)
      setUploadProgress(0)
    }
  }, [open, document, form])

  const onSubmit = async (values: FormValues) => {
    if (!selectedFile) {
      toast.error("Please attach a new document file.")
      return
    }
    if (!user?.id || !document) return

    setIsSubmitting(true)
    try {
      const fileMeta = await uploadFileToStorage(
        selectedFile,
        user.id,
        (pct) => setUploadProgress(pct)
      )

      const result = await uploadNewVersion(document.id, {
        title: values.title,
        description: values.description,
        documentDate: values.documentDate,
        fileName: fileMeta.fileName,
        fileSize: fileMeta.fileSize,
        fileUrl: fileMeta.fileUrl,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`Successfully uploaded Version ${result.data?.newVersion}!`)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        className="w-full sm:max-w-lg p-0 flex flex-col bg-slate-50 overflow-hidden border-l border-slate-200"
      >
        <SheetHeader className="p-6 bg-white border-b border-slate-200 flex-row items-center justify-between sticky top-0 z-10 shrink-0">
          <SheetTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Upload New Version
          </SheetTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900">Document Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Document Title <span className="text-red-500">*</span></Label>
                <Input id="title" {...form.register("title")} disabled={isSubmitting} />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="documentDate">Document Date <span className="text-red-500">*</span></Label>
                <Input id="documentDate" type="date" {...form.register("documentDate")} disabled={isSubmitting} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" {...form.register("description")} disabled={isSubmitting} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900">Upload File</h3>
            <FileUploadZone
              onFileSelect={setSelectedFile}
              disabled={isSubmitting}
            />
            {isSubmitting && uploadProgress > 0 && (
              <div className="mt-2 text-sm text-slate-600 font-medium">
                Uploading: {Math.round(uploadProgress)}%
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex justify-end gap-3 sticky bottom-0 z-10">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit New Version
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
