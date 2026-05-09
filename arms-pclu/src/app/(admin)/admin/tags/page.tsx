"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { SystemTags } from "@/components/tags/SystemTags"
import { TagList, type CustomTag } from "@/components/tags/TagList"
import { TagFormModal } from "@/components/tags/TagFormModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

const mockTags: CustomTag[] = [
  { id: "1", name: "Priority", color: "#EF4444", documentsCount: 5, createdAt: "Oct 12, 2024" },
  { id: "2", name: "For Review", color: "#F59E0B", documentsCount: 2, createdAt: "Oct 11, 2024" },
  { id: "3", name: "Finalized", color: "#10B981", documentsCount: 12, createdAt: "Oct 10, 2024" },
  { id: "4", name: "Archived", color: "#64748B", documentsCount: 0, createdAt: "Oct 09, 2024" },
]

export default function TagsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<CustomTag | undefined>()
  const [deletingTag, setDeletingTag] = React.useState<CustomTag | null>(null)

  const handleCreate = () => {
    setEditingTag(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (tag: CustomTag) => {
    setEditingTag(tag)
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    console.log("Delete tag", deletingTag?.id)
    setDeletingTag(null)
  }

  return (
    <>
      <PageHeader
        title="Tag Management"
        subtitle="Organize accreditation documents with custom tags"
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tag
          </Button>
        }
      />

      <div className="space-y-4">
        <SystemTags />

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-semibold text-slate-800">Custom Tags</h3>
            <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full font-bold">
              {mockTags.length}
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <TagList 
              tags={mockTags} 
              onEdit={handleEdit}
              onDelete={setDeletingTag}
            />
          </div>
        </div>
      </div>

      <TagFormModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingTag ? { name: editingTag.name, color: editingTag.color } : undefined}
      />

      <ConfirmDialog 
        open={!!deletingTag}
        onClose={() => setDeletingTag(null)}
        onConfirm={handleDelete}
        title="Delete Tag"
        description={`Are you sure you want to delete the "${deletingTag?.name}" tag? This action cannot be undone.`}
        type="danger"
      />
    </>
  )
}
