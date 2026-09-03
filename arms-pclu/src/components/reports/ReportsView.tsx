"use client"

import * as React from "react"
import { 
  BarChart3, 
  Users, 
  Archive, 
  Download, 
  FileCheck2, 
  Lock, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Table as TableIcon
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAreas } from "@/hooks/useAreas"
import { toast } from "sonner"
import { 
  getComplianceReportData, 
  getFacultyContributionReportData, 
  getApprovedDocumentsReportData 
} from "@/actions/report.actions"
import { generateInstitutionalPdfReport } from "@/lib/reportPdfGenerator"

const reportTypes = [
  { 
    id: "compliance", 
    title: "Compliance Summary Report", 
    desc: "Detailed compliance rate per indicator and PACUCOA Area (Approved vs Required).", 
    icon: BarChart3, 
    color: "blue" 
  },
  { 
    id: "faculty", 
    title: "Faculty Contribution Report", 
    desc: "Submission activity, approval counts, and assigned area progress for all active faculty.", 
    icon: Users, 
    color: "emerald" 
  },
  { 
    id: "approved", 
    title: "Approved Documents List", 
    desc: "Official register of all verified and approved accreditation evidence.", 
    icon: Archive, 
    color: "violet" 
  },
]

export function ReportsView() {
  const [selectedReport, setSelectedReport] = React.useState("compliance")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [areaId, setAreaId] = React.useState("all")
  const [previewData, setPreviewData] = React.useState<Record<string, any>[] | null>(null)

  const { data: areas = [] } = useAreas()

  const getColorClass = (color: string) => {
    switch(color) {
      case "blue": return "bg-blue-50 text-blue-600 border-blue-200"
      case "violet": return "bg-violet-50 text-violet-600 border-violet-200"
      case "emerald": return "bg-emerald-50 text-emerald-600 border-emerald-200"
      default: return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  // Clear preview when report type or filters change
  React.useEffect(() => {
    setPreviewData(null)
  }, [selectedReport, startDate, endDate, areaId])

  const fetchReportData = async () => {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    if (end) {
      end.setHours(23, 59, 59, 999)
    }

    let result
    if (selectedReport === "compliance") {
      result = await getComplianceReportData(areaId, start, end)
    } else if (selectedReport === "faculty") {
      result = await getFacultyContributionReportData(start, end)
    } else if (selectedReport === "approved") {
      result = await getApprovedDocumentsReportData(areaId, start, end)
    }

    return result
  }

  const handlePreview = async () => {
    setIsLoadingPreview(true)
    try {
      const result = await fetchReportData()
      if (!result?.success || !result.data || result.data.length === 0) {
        toast.error("No data found for the selected criteria.")
        setPreviewData([])
        return
      }
      setPreviewData(result.data)
      toast.success(`Loaded ${result.data.length} records for preview.`)
    } catch (error) {
      console.error("Preview failed:", error)
      toast.error("Failed to load report preview.")
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDownloadPdf = async () => {
    setIsGenerating(true)
    try {
      let data = previewData
      if (!data || data.length === 0) {
        const result = await fetchReportData()
        if (!result?.success || !result.data || result.data.length === 0) {
          toast.error("No records found to include in the report.")
          return
        }
        data = result.data
        setPreviewData(data)
      }

      const activeReportMeta = reportTypes.find(r => r.id === selectedReport)
      const selectedAreaName = areaId === "all" 
        ? "All PACUCOA Areas" 
        : areas.find(a => a.id === areaId)?.name || "Selected Area"
      
      const dateRangeStr = startDate && endDate 
        ? `${startDate} to ${endDate}` 
        : startDate 
          ? `From ${startDate}` 
          : endDate 
            ? `Up to ${endDate}` 
            : "All Time"

      const dateStr = new Date().toISOString().split("T")[0]
      const fileName = `PCLU_ARMS_${selectedReport}_report_${dateStr}.pdf`

      generateInstitutionalPdfReport({
        title: activeReportMeta?.title || "Accreditation Report",
        subtitle: "Polytechnic College of La Union • PACUCOA Accreditation Management",
        scopeDescription: selectedReport === "faculty" ? "All Active Faculty" : selectedAreaName,
        dateRangeDescription: dateRangeStr,
        fileName,
        data,
      })

      toast.success("Official PDF report generated and downloaded successfully!")
    } catch (error) {
      console.error("Report PDF generation failed:", error)
      toast.error("An error occurred while generating the PDF report.")
    } finally {
      setIsGenerating(false)
    }
  }

  const showAreaFilter = selectedReport === "compliance" || selectedReport === "approved"

  return (
    <>
      <PageHeader
        title="Reports & Official Certification"
        subtitle="Generate and download verified, tamper-proof institutional PDF reports for PACUCOA accreditation"
      />

      <div className="space-y-6">
        {/* Report Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                "bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 flex flex-col hover:-translate-y-0.5 hover:shadow-md relative",
                selectedReport === report.id
                  ? "border-blue-600 shadow-sm ring-2 ring-blue-600/20"
                  : "border-slate-200 shadow-xs hover:border-slate-300"
              )}
            >
              <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center mb-3.5 border transition-colors", getColorClass(report.color))}>
                <report.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{report.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 flex-1 leading-relaxed">{report.desc}</p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={cn(
                  "text-xs font-semibold flex items-center gap-1.5",
                  selectedReport === report.id ? "text-blue-600" : "text-slate-400"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    selectedReport === report.id ? "bg-blue-600" : "bg-slate-300"
                  )} />
                  {selectedReport === report.id ? "Active Template" : "Select"}
                </span>

                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Read-Only PDF
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Configure Report Parameters</h2>
                <p className="text-xs text-slate-500">Filters are applied strictly to non-archived verified database records</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tamper-Proof Export Format</span>
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Date Range (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs text-slate-700 bg-slate-50/50 border-slate-200"
                />
                <span className="text-slate-400 font-medium text-xs">to</span>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs text-slate-700 bg-slate-50/50 border-slate-200"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedReport === "approved" 
                  ? "Filters by the date the document was approved." 
                  : "Leave blank to include all historical records."}
              </p>
            </div>

            {/* Area Filter */}
            {showAreaFilter && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Area Scope</Label>
                <Select value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger className="h-9 text-xs text-slate-700 bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="All PACUCOA Areas" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-xs">
                    <SelectItem value="all">All PACUCOA Areas</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">Scope report to a specific PACUCOA accreditation area or all areas.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="md:col-span-2 pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isLoadingPreview || isGenerating}
                className="w-full sm:w-auto h-11 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 px-5"
              >
                <Eye className={cn("w-4 h-4 mr-2 text-slate-500", isLoadingPreview && "animate-spin")} />
                {isLoadingPreview ? "Loading Preview..." : "Preview Data On-Screen"}
              </Button>

              <Button
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 text-xs font-bold shadow-xs hover:shadow-md transition-all px-6"
                onClick={handleDownloadPdf}
                disabled={isGenerating || isLoadingPreview}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Official PDF Document...
                  </span>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Official PDF Report (Non-Editable)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── ON-SCREEN PREVIEW TABLE ─────────────────────────────────── */}
        {previewData && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in-50 duration-200">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Data Preview ({previewData.length} record{previewData.length === 1 ? "" : "s"})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Verified figures ready for official export
              </span>
            </div>

            {previewData.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No records found matching the specified parameters.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="py-2.5 px-4 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        {Object.keys(previewData[0]).map((key) => {
                          const val = String(row[key] ?? "")
                          const isStatus = key.toLowerCase().includes("status")
                          return (
                            <td key={key} className="py-2.5 px-4 whitespace-nowrap">
                              {isStatus ? (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                  val === "Compliant" || val === "Active Contributor" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : val === "Needs Attention" || val === "No Submissions"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                )}>
                                  {val}
                                </span>
                              ) : (
                                val
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
