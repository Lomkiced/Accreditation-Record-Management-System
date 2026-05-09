"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TagBadge } from "./TagBadge"
import { cn } from "@/lib/utils"

const tagSchema = z.object({
  name: z.string().min(1, "Tag Name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color code"),
})

type TagFormValues = z.infer<typeof tagSchema>

interface TagFormModalProps {
  open: boolean
  onClose: () => void
  initialData?: TagFormValues
}

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#F43F5E", // rose
]

export function TagFormModal({ open, onClose, initialData }: TagFormModalProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: initialData || {
      name: "",
      color: "#3B82F6",
    },
  })

  const selectedColor = form.watch("color")
  const watchedName = form.watch("name")

  React.useEffect(() => {
    if (open) {
      form.reset(initialData || { name: "", color: "#3B82F6" })
    }
  }, [open, initialData, form])

  const onSubmit = (data: TagFormValues) => {
    console.log(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tag" : "Create New Tag"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tag Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              placeholder="e.g., Priority, For Review" 
              {...form.register("name")} 
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-3">
            <Label>Tag Color <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-7 h-7 rounded-full transition-all focus:outline-none",
                    selectedColor === color 
                      ? "ring-2 ring-offset-2 scale-110" 
                      : "hover:scale-110"
                  )}
                  style={{ 
                    backgroundColor: color,
                    ...(selectedColor === color ? { ringColor: color } : {})
                  }}
                  onClick={() => form.setValue("color", color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-500">Custom hex:</span>
              <Input 
                type="text" 
                {...form.register("color")} 
                className="w-28 h-8 font-mono text-xs uppercase"
              />
              <div 
                className="w-6 h-6 rounded border ml-1"
                style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(selectedColor) ? selectedColor : '#ccc' }}
              />
            </div>
            {form.formState.errors.color && (
              <p className="text-xs text-red-500">{form.formState.errors.color.message}</p>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
            <Label className="mb-3 text-slate-500 text-xs">Preview</Label>
            <TagBadge 
              name={watchedName || "Sample Tag"} 
              color={/^#[0-9A-F]{6}$/i.test(selectedColor) ? selectedColor : "#3B82F6"} 
              size="md"
            />
            <p className="text-xs text-slate-400 mt-3 text-center">
              This is how the tag will appear on documents
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Tag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
