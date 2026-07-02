"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { SystemTags } from "@/components/tags/SystemTags"
import { TagList, type CustomTag } from "@/components/tags/TagList"
import { TagFormModal } from "@/components/tags/TagFormModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useTagManagement, useDeleteTag } from "@/hooks/useTagManagement"
import { Skeleton } from "@/components/ui/skeleton"

export default function TagsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<CustomTag | undefined>()
  const [deletingTag, setDeletingTag] = React.useState<CustomTag | null>(null)

  const { data: tags = [], isLoading } = useTagManagement()
  const deleteTag = useDeleteTag()

  const customTags = React.useMemo(() => 
    tags.filter(t => t.type === "CUSTOM"), 
  [tags])

  const handleCreate = () => {
    setEditingTag(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (tag: CustomTag) => {
    setEditingTag(tag)
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    if (deletingTag) {
      deleteTag.mutate(deletingTag.id)
    }
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
              {customTags.length}
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <TagList 
                tags={customTags} 
                onEdit={handleEdit}
                onDelete={setDeletingTag}
              />
            )}
          </div>
        </div>
      </div>

      <TagFormModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tagToEdit={editingTag}
      />

      <ConfirmDialog 
        open={!!deletingTag}
        onClose={() => setDeletingTag(null)}
        onConfirm={handleDelete}
        title="Delete Tag"
        description={`Are you sure you want to delete the "${deletingTag?.name}" tag? This action cannot be undone and will remove the tag from all documents.`}
        type="danger"
        isPending={deleteTag.isPending}
      />
    </>
  )
}
