"use client"

import * as React from "react"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FileUploadZone } from "@/components/shared/FileUploadZone"

const mockArea = {
  id: "1",
  number: 2,
  name: "Area 2: Faculty",
}

const mockAssignedCriteria = [
  {
    id: "c1",
    name: "A. Academic Qualifications",
    indicators: [
      { 
        id: "i1", 
        number: "2.1", 
        name: "Faculty have appropriate degrees.", 
        requiredDocs: "TOR, Diploma", 
        submission: { status: "APPROVED", file: "TOR_Diplomas.pdf" } 
      },
      { 
        id: "i2", 
        number: "2.2", 
        name: "Faculty are licensed professionals where applicable.", 
        requiredDocs: "PRC License", 
        submission: { status: "RETURNED", file: "PRC_Licenses.pdf", remarks: "Please upload high-resolution scans." } 
      },
    ]
  },
  {
    id: "c2",
    name: "B. Professional Performance",
    indicators: [
      { 
        id: "i3", 
        number: "2.3", 
        name: "Faculty undergo regular evaluation.", 
        requiredDocs: "Evaluation Forms, Summary Report", 
        submission: null 
      },
    ]
  }
]

export default function MyAreaDetailPage({ params }: { params: { id: string } }) {
  const [activeUploadId, setActiveUploadId] = React.useState<string | null>(null)

  return (
    <>
      <PageHeader
        title={mockArea.name}
        breadcrumbs={[
          { label: "My Areas", href: "/faculty/my-areas" },
          { label: mockArea.name },
        ]}
      />

      <div className="space-y-4">
        {mockAssignedCriteria.map((criterion) => (
          <div key={criterion.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 text-lg">{criterion.name}</h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {criterion.indicators.map((ind) => (
                <div key={ind.id} className="p-5 flex flex-col lg:flex-row gap-6">
                  {/* Indicator Details */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-slate-900 mt-0.5">{ind.number}</span>
                      <div>
                        <p className="font-medium text-slate-800">{ind.name}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          <span className="font-medium text-slate-600">Required:</span> {ind.requiredDocs}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission Status & Action */}
                  <div className="w-full lg:w-96 shrink-0 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col">
                    {ind.submission ? (
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{ind.submission.file}</span>
                          </div>
                          <StatusBadge status={ind.submission.status} size="sm" />
                        </div>
                        
                        {ind.submission.status === "RETURNED" && (
                          <div className="mt-2 bg-red-50 text-red-600 text-xs p-2 rounded-md border border-red-100 flex items-start gap-1.5 mb-3">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{ind.submission.remarks}</span>
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t border-slate-200">
                          {ind.submission.status === "APPROVED" ? (
                            <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium">
                              <CheckCircle className="w-4 h-4" /> Requirement Met
                            </div>
                          ) : (
                            <Button 
                              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full justify-center"
                              onClick={() => setActiveUploadId(ind.id)}
                            >
                              Update Document
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full items-center justify-center text-center space-y-3">
                        {activeUploadId === ind.id ? (
                          <div className="w-full">
                            <FileUploadZone
                              onFileSelect={(file) => {
                                if (file) console.log(file)
                                setActiveUploadId(null)
                              }}
                              accept=".pdf"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full mt-2 text-xs"
                              onClick={() => setActiveUploadId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4" /> Needs Submission
                            </div>
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                              onClick={() => setActiveUploadId(ind.id)}
                            >
                              <Upload className="w-4 h-4 mr-2" /> Upload Document
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
