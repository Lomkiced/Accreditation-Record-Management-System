"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CriterionList } from "./CriterionList"

import { AreaWithHierarchy } from "@/actions/area.actions"

interface AreaCardProps {
  area: AreaWithHierarchy
}

export function AreaCard({ area }: AreaCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Cycling colors for the number badge
  const COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
  ]
  const number = (area.order ?? 0) + 1
  const colorClass = COLORS[(number - 1) % COLORS.length]

  // Calculate dynamic stats
  const criteriaCount = area.criteria.length
  
  let totalIndicators = 0
  let approvedIndicators = 0
  
  area.criteria.forEach(criterion => {
    totalIndicators += criterion.indicators.length
    criterion.indicators.forEach(indicator => {
      // If there is any approved mapping for this indicator, it counts as fulfilled
      const isApproved = indicator.mappings.some(m => m.status === "APPROVED")
      if (isApproved) approvedIndicators++
    })
  })

  const completion = totalIndicators === 0 ? 0 : Math.round((approvedIndicators / totalIndicators) * 100)

  const getCompletionPill = (completion: number) => {
    if (totalIndicators === 0) return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">No Indicators</span>
    if (completion === 100) return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">100% Complete</span>
    if (completion > 0) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{completion}% Partial</span>
    return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">0%</span>
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-3 overflow-hidden">
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${colorClass}`}>
          {number}
        </div>
        <h3 className="font-semibold text-slate-800 ml-3">{area.name}</h3>
        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-2 font-medium">
          {criteriaCount} Criteria
        </span>
        
        <div className="ml-auto flex items-center gap-3">
          {getCompletionPill(completion)}
          
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

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
              <CriterionList areaId={area.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
