"use client"

import * as React from "react"
import { BarChart3, Users, Archive, Download, Sheet } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAreas } from "@/hooks/useAreas"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { 
  getComplianceReportData, 
  getFacultyContributionReportData, 
  getApprovedDocumentsReportData 
} from "@/actions/report.actions"

const reportTypes = [
  { id: "compliance", title: "Compliance Summary Report", desc: "Overall accreditation readiness per PACUCOA Area", icon: BarChart3, color: "blue" },
  { id: "faculty", title: "Faculty Contribution Report", desc: "Submission activity and compliance per faculty", icon: Users, color: "emerald" },
  { id: "approved", title: "Approved Documents List", desc: "Detailed export of all fully approved documents", icon: Archive, color: "violet" },
]

export function ReportsView() {
  const [selectedReport, setSelectedReport] = React.useState("compliance")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [areaId, setAreaId] = React.useState("all")

  const { data: areas = [] } = useAreas()

  const getColorClass = (color: string) => {
    switch(color) {
      case "blue": return "bg-blue-100 text-blue-600"
      case "violet": return "bg-violet-100 text-violet-600"
      case "emerald": return "bg-emerald-100 text-emerald-600"
      default: return "bg-slate-100 text-slate-600"
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      let result;
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined

      // If end date is specified, set to end of day
      if (end) {
        end.setHours(23, 59, 59, 999)
      }

      if (selectedReport === "compliance") {
        result = await getComplianceReportData(areaId, start, end)
      } else if (selectedReport === "faculty") {
        result = await getFacultyContributionReportData(start, end)
      } else if (selectedReport === "approved") {
        result = await getApprovedDocumentsReportData(areaId, start, end)
      }

      if (!result?.success || !result.data || result.data.length === 0) {
        toast.error("No data found for the selected criteria.")
        return
      }

      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(result.data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data")

      // Generate file name
      const dateStr = new Date().toISOString().split("T")[0]
      const fileName = `${selectedReport}_report_${dateStr}.xlsx`

      XLSX.writeFile(workbook, fileName)
      toast.success("Report downloaded successfully!")
      
    } catch (error) {
      console.error("Report generation failed:", error)
      toast.error("An error occurred while generating the report.")
    } finally {
      setIsGenerating(false)
    }
  }

  const showAreaFilter = selectedReport === "compliance" || selectedReport === "approved"

  return (
    <>
      <PageHeader
        title="Reports & Export"
        subtitle="Generate and download Excel reports for accreditation compliance"
      />

      <div className="space-y-4">
        {/* Report Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                "bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 flex flex-col hover:-translate-y-1 hover:shadow-lg",
                selectedReport === report.id
                  ? "border-blue-500 shadow-md ring-1 ring-blue-500"
                  : "border-slate-200 shadow-sm"
              )}
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors", getColorClass(report.color))}>
                <report.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{report.title}</h3>
              <p className="text-sm text-slate-500 mt-2 flex-1">{report.desc}</p>
              
              <div className="mt-4 flex items-center">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                  selectedReport === report.id ? "border-blue-500" : "border-slate-300"
                )}>
                  {selectedReport === report.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-semibold",
                  selectedReport === report.id ? "text-blue-600" : "text-slate-500"
                )}>
                  {selectedReport === report.id ? "Selected" : "Select"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Configure Output</h2>
              <p className="text-sm text-slate-500">Filter data before generating your Excel spreadsheet</p>
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Date Range (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-slate-700"
                />
                <span className="text-slate-400 font-medium text-sm">to</span>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-slate-700"
                />
              </div>
            </div>

            {/* Area Filter */}
            {showAreaFilter && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Area Filter</Label>
                <Select value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger className="w-full text-slate-700">
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Button */}
            <div className="md:col-span-2 pt-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-bold shadow-md hover:shadow-lg transition-all"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  "Building Excel Spreadsheet..."
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Excel Report
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
