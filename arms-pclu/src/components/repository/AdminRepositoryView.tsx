"use client"

import * as React from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Download, 
  Eye, 
  User, 
  Calendar,
  Layers,
  FolderOpen
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AreaWithApprovedDocuments, ApprovedDocument } from "@/actions/repository.actions"
import { Button } from "@/components/ui/button"

export function AdminRepositoryView({ data }: { data: AreaWithApprovedDocuments[] }) {
  const [expandedArea, setExpandedArea] = React.useState<string | null>(data[0]?.id || null)

  const handleDownload = (doc: ApprovedDocument) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank")
    }
  }

  return (
    <div className="space-y-4">
      {data.map((area) => (
        <div 
          key={area.id} 
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300"
        >
          {/* Accordion Header */}
          <button
            onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
            className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                expandedArea === area.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
              }`}>
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{area.name}</h3>
                <p className="text-sm text-slate-500 font-medium">
                  {area.documents.length} {area.documents.length === 1 ? 'Approved Document' : 'Approved Documents'}
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-full transition-transform duration-300 ${
              expandedArea === area.id ? "rotate-180 bg-slate-200/50" : "bg-transparent text-slate-400"
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {/* Accordion Content */}
          <AnimatePresence>
            {expandedArea === area.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-5 pt-2 border-t border-slate-100 bg-white">
                  {area.documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">No approved documents yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Documents will appear here once they are fully approved.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                      {area.documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="group relative flex flex-col p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                        >
                          {/* Document Info */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-800 text-sm truncate" title={doc.title}>
                                {doc.title}
                              </h4>
                              <p className="text-xs text-slate-500 truncate mt-0.5" title={doc.fileName || "No file"}>
                                {doc.fileName || "No file uploaded"}
                              </p>
                            </div>
                          </div>

                          {/* Meta details */}
                          <div className="space-y-2 mb-4 flex-1">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{doc.facultyName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                                {doc.indicators.slice(0, 3).map((ind, idx) => (
                                  <span key={idx} className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200 truncate max-w-[140px]" title={`${ind.criterionName} - ${ind.name}`}>
                                    {ind.name}
                                  </span>
                                ))}
                                {doc.indicators.length > 3 && (
                                  <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200 shrink-0">
                                    +{doc.indicators.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 border-transparent shadow-none"
                              onClick={() => handleDownload(doc)}
                              disabled={!doc.fileUrl}
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-slate-600 hover:text-slate-800 shadow-none"
                              onClick={() => handleDownload(doc)}
                              disabled={!doc.fileUrl}
                            >
                              <Download className="w-4 h-4 mr-1.5" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
