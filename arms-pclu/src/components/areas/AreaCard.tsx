"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CriterionList } from "./CriterionList"
import { AreaFormModal } from "./AreaFormModal"
import { useDeleteArea } from "@/hooks/useAreas"
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

import { AreaWithHierarchy } from "@/actions/area.actions"

interface AreaCardProps {
  area: AreaWithHierarchy
  mode?: "dean" | "admin"
}

export function AreaCard({ area, mode = "dean" }: AreaCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const deleteArea = useDeleteArea()



  // Calculate dynamic stats
  const criteriaCount = area.criteria.length
  
  let totalIndicators = 0
  let approvedIndicators = 0
  
  area.criteria.forEach(criterion => {
    totalIndicators += criterion.indicators.length
    criterion.indicators.forEach(indicator => {
      // mappings may be omitted depending on which getAreas variant was called
      const mappings = (indicator as any).mappings ?? []
      const isApproved = mappings.some((m: any) => m.status === "APPROVED")
      if (isApproved) approvedIndicators++
    })
  })

  const completion = totalIndicators === 0 ? 0 : Math.round((approvedIndicators / totalIndicators) * 100)

  const getCompletionPill = () => {
    if (mode === "admin") {
      if (totalIndicators === 0) return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">No Indicators</span>
      if (completion === 100) return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">100% Complete</span>
      if (completion > 0) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{completion}% Partial</span>
      return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">0%</span>
    }
    
    if (totalIndicators === 0) return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">No Indicators</span>
    if (approvedIndicators === totalIndicators && totalIndicators > 0) return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{approvedIndicators}/{totalIndicators} docs</span>
    if (approvedIndicators > 0) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{approvedIndicators}/{totalIndicators} docs</span>
    return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">0/{totalIndicators} docs</span>
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-3 overflow-hidden">
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-slate-800">{area.name}</h3>
        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-2 font-medium">
          {criteriaCount} Sub-Areas
        </span>
        
        <div className="ml-auto flex items-center gap-3">
          {getCompletionPill()}
          
          {mode === "dean" && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="bg-[#F8FAFC] border-t border-slate-200 p-4">
              <CriterionList areaId={area.id} mode={mode} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AreaFormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        areaId={area.id}
        initialData={{ name: area.name, description: area.description || undefined }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the area
              <strong> {area.name}</strong> and all its associated sub-areas and indicators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteArea.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              disabled={deleteArea.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteArea.mutate(area.id, {
                  onSuccess: () => setIsDeleteDialogOpen(false)
                });
              }}
            >
              {deleteArea.isPending ? "Deleting..." : "Delete Area"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
