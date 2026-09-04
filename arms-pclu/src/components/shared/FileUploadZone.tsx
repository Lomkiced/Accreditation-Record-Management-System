"use client"

import * as React from "react"
import { UploadCloud, FileText, X } from "lucide-react"
import { cn, formatFileSize } from "@/lib/utils"

interface FileUploadZoneProps {
  onFileSelect?: (file: File | null) => void
  onFilesSelect?: (files: File[]) => void
  multiple?: boolean
  accept?: string
  maxSize?: number
  disabled?: boolean
}

export function FileUploadZone({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  accept = ".pdf,.docx,.xlsx,.jpg,.png",
  maxSize = 25 * 1024 * 1024,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const validateFiles = (files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase())
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      if (file.size > maxSize) {
        errors.push(`"${file.name}" exceeds ${formatFileSize(maxSize)} limit.`)
        continue
      }
      const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!acceptedTypes.includes(fileExt)) {
        errors.push(`"${file.name}" is an unsupported file type. Accepted: ${accept}`)
        continue
      }
      validFiles.push(file)
    }

    if (errors.length > 0) {
      setError(errors.slice(0, 2).join(" "))
    }

    if (validFiles.length > 0) {
      if (multiple && onFilesSelect) {
        onFilesSelect(validFiles)
      } else if (onFileSelect) {
        setSelectedFile(validFiles[0])
        onFileSelect(validFiles[0])
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(e.target.files)
    }
    // reset input so the same files can be re-selected if needed
    e.target.value = ""
  }

  const clearFile = () => {
    setSelectedFile(null)
    onFileSelect?.(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8",
        "text-center cursor-pointer transition-all duration-200",
        isDragging
          ? "border-blue-400 bg-blue-50 scale-[1.01]"
          : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
        !!error && "border-red-400 bg-red-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
          !multiple && selectedFile && "pointer-events-none",
          disabled && "cursor-not-allowed"
        )}
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!multiple && selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
            <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearFile()
            }}
            className="ml-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {multiple
              ? "Drag & drop one or multiple files here or "
              : "Drag & drop your file here or "}
            <span className="text-blue-600 font-semibold">click to browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, JPG, PNG up to 25MB each</p>
        </>
      )}
    </div>
  )
}
