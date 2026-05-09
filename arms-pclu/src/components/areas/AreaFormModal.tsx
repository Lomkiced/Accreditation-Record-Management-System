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
import { Textarea } from "@/components/ui/textarea"

const areaSchema = z.object({
  name: z.string().min(1, "Area Name is required"),
  description: z.string().optional(),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaFormModalProps {
  open: boolean
  onClose: () => void
  initialData?: AreaFormValues
}

export function AreaFormModal({ open, onClose, initialData }: AreaFormModalProps) {
  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
    },
  })

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (open) {
      form.reset(initialData || { name: "", description: "" })
    }
  }, [open, initialData, form])

  const onSubmit = (data: AreaFormValues) => {
    console.log(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Area" : "Add New Area"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Area Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              placeholder="e.g., Area 1: Purposes and Objectives" 
              {...form.register("name")} 
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Brief description of this area..." 
              {...form.register("description")} 
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Area
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
