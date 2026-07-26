"use client"

import * as React from "react"
import { 
  FileText, 
  RotateCcw,
  Trash2,
  AlertCircle
} from "lucide-react"
import { useArchivedDocuments, useRestoreDocument, usePermanentlyDeleteDocument } from "@/hooks/useArchives"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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

export function ArchivesClient() {
  const { data: documents = [], isLoading } = useArchivedDocuments()
  const { mutate: restoreDoc, isPending: isRestoring } = useRestoreDocument()
  const { mutate: deleteDoc, isPending: isDeleting } = usePermanentlyDeleteDocument()

  const [documentToDelete, setDocumentToDelete] = React.useState<string | null>(null)

  const handleRestore = (id: string) => {
    restoreDoc(id)
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDoc(documentToDelete, {
        onSuccess: () => setDocumentToDelete(null)
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Archived Documents</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          When you archive a document, it will appear here. You can safely restore or permanently delete them later.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="group flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors p-4 relative"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-800 truncate" title={doc.title}>
                  {doc.title}
                </h4>
                <p className="text-xs text-slate-500 truncate" title={doc.fileName || ""}>
                  {doc.fileName || "No file uploaded"}
                </p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Archived on:</span>{" "}
                {new Date(doc.updatedAt).toLocaleDateString()}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {doc.mappings.map(m => (
                  <span key={m.id} className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-600 truncate max-w-full">
                    {m.indicator.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-slate-600 hover:text-slate-900"
                onClick={() => handleRestore(doc.id)}
                disabled={isRestoring || isDeleting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-transparent bg-rose-50/50"
                onClick={() => setDocumentToDelete(doc.id)}
                disabled={isRestoring || isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this document? This action cannot be undone. 
              The file will be permanently removed from your vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
