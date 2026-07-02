"use client"

import * as React from "react"
import { AlertTriangle, Trash2, Info } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  type?: "danger" | "warning" | "info"
  confirmText?: string
  cancelText?: string
  isPending?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  type = "danger",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPending = false,
}: ConfirmDialogProps) {
  
  const getIcon = () => {
    switch (type) {
      case "danger": return <Trash2 className="w-6 h-6 text-red-600" />
      case "warning": return <AlertTriangle className="w-6 h-6 text-amber-600" />
      case "info": return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case "danger": return "bg-red-100"
      case "warning": return "bg-amber-100"
      case "info": return "bg-blue-100"
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className={cn("shrink-0 p-2 rounded-full", getIconBg())}>
            {getIcon()}
          </div>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (!isPending) onConfirm()
            }}
            disabled={isPending}
            className={
              type === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : type === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {isPending ? "Please wait..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
