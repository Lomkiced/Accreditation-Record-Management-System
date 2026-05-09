"use client"

import { useState } from "react"
import { Download, FileText, Sheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type OutputFormat = "pdf" | "excel"

const REPORT_TYPES = [
  { value: "compliance", label: "Compliance Summary Report" },
  { value: "document-package", label: "Document Package Export" },
  { value: "faculty-contribution", label: "Faculty Contribution Report" },
  { value: "logbook-summary", label: "Logbook Summary Report" },
]

export function ReportConfigPanel() {
  const [reportType, setReportType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!reportType) return
    setIsGenerating(true)
    // TODO: Connect to report.actions.ts in backend stage
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-base font-semibold text-slate-800 mb-4">
        Configure & Generate Report
      </h3>

      <div className="space-y-4">
        {/* Report type */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Report Type
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a report type..." />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
              From Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
              To Date
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Output format */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Output Format
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {/* PDF option */}
            <button
              type="button"
              onClick={() => setOutputFormat("pdf")}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                "border-2 transition-all duration-150",
                outputFormat === "pdf"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                outputFormat === "pdf" ? "bg-red-100" : "bg-slate-100"
              )}>
                <FileText className={cn(
                  "w-4 h-4",
                  outputFormat === "pdf" ? "text-red-600" : "text-slate-400"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "text-sm font-semibold",
                  outputFormat === "pdf" ? "text-blue-700" : "text-slate-700"
                )}>PDF</p>
                <p className="text-xs text-slate-400">Print-ready</p>
              </div>
            </button>

            {/* Excel option */}
            <button
              type="button"
              onClick={() => setOutputFormat("excel")}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                "border-2 transition-all duration-150",
                outputFormat === "excel"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                outputFormat === "excel" ? "bg-emerald-100" : "bg-slate-100"
              )}>
                <Sheet className={cn(
                  "w-4 h-4",
                  outputFormat === "excel" ? "text-emerald-600" : "text-slate-400"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "text-sm font-semibold",
                  outputFormat === "excel" ? "text-blue-700" : "text-slate-700"
                )}>Excel</p>
                <p className="text-xs text-slate-400">Spreadsheet</p>
              </div>
            </button>
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!reportType || isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
