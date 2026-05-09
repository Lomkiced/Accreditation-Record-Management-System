"use client"

import * as React from "react"
import { BarChart3, Archive, Users, BookMarked, FileText, Sheet, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const reportTypes = [
  { id: "compliance", title: "Compliance Summary Report", desc: "Overall accreditation readiness per PAASCU Area", icon: BarChart3, color: "blue" },
  { id: "export", title: "Document Package Export", desc: "Export all approved documents per Area for accreditors", icon: Archive, color: "violet" },
  { id: "faculty", title: "Faculty Contribution Report", desc: "Submission activity and compliance per faculty", icon: Users, color: "emerald" },
  { id: "logbook", title: "Logbook Summary Report", desc: "Incoming/outgoing document log with acknowledgment status", icon: BookMarked, color: "amber" },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = React.useState("compliance")
  const [format, setFormat] = React.useState<"pdf" | "excel">("pdf")
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const getColorClass = (color: string) => {
    switch(color) {
      case "blue": return "bg-blue-100 text-blue-600"
      case "violet": return "bg-violet-100 text-violet-600"
      case "emerald": return "bg-emerald-100 text-emerald-600"
      case "amber": return "bg-amber-100 text-amber-600"
      default: return "bg-slate-100 text-slate-600"
    }
  }

  return (
    <>
      <PageHeader
        title="Reports & Export"
        subtitle="Generate compliance reports and export document packages"
      />

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                "bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 flex flex-col",
                selectedReport === report.id
                  ? "border-blue-500 shadow-md ring-1 ring-blue-500"
                  : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
              )}
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", getColorClass(report.color))}>
                <report.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">{report.title}</h3>
              <p className="text-sm text-slate-500 mt-1 flex-1">{report.desc}</p>
              {selectedReport === report.id && (
                <Button className="w-full mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100" variant="secondary">
                  Selected
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Configure & Generate Report</h2>
        
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <Label>Selected Report Type</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                {reportTypes.find(r => r.id === selectedReport)?.title}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="w-full justify-start text-left font-normal text-slate-500">
                  Start Date
                </Button>
                <span className="text-slate-400">to</span>
                <Button variant="outline" className="w-full justify-start text-left font-normal text-slate-500">
                  End Date
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Area Filter</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="1">Area 1</SelectItem>
                  <SelectItem value="2">Area 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

          <div className="col-span-2 space-y-2 mt-4">
            <Label>Output Format</Label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={cn(
                  "border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                  format === "pdf" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 hover:bg-slate-50"
                )}
                onClick={() => setFormat("pdf")}
              >
                <FileText className={cn("w-8 h-8 mb-2", format === "pdf" ? "text-blue-600" : "text-slate-400")} />
                <span className={cn("font-medium", format === "pdf" ? "text-blue-700" : "text-slate-600")}>PDF Document</span>
              </div>
              <div 
                className={cn(
                  "border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                  format === "excel" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-slate-200 hover:bg-slate-50"
                )}
                onClick={() => setFormat("excel")}
              >
                <Sheet className={cn("w-8 h-8 mb-2", format === "excel" ? "text-emerald-600" : "text-slate-400")} />
                <span className={cn("font-medium", format === "excel" ? "text-emerald-700" : "text-slate-600")}>Excel Spreadsheet</span>
              </div>
            </div>
          </div>

            <div className="col-span-2 pt-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  "Generating report..."
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Generate & Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Recent Exports</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Report Name</th>
                  <th className="px-4 py-3 font-medium">Generated By</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Format</th>
                  <th className="px-4 py-3 font-medium text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Compliance Summary_Q4.pdf</td>
                  <td className="px-4 py-3 text-slate-600">Admin User</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">Oct 12, 2024</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">PDF</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
