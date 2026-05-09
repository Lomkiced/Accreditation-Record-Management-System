"use client"

import * as React from "react"
import { Download, CheckCircle, XCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"

interface VersionHistoryProps {
  versions: Array<{
    version: number
    fileUrl?: string
    fileName?: string
    createdAt?: string
    date?: string
    status: string
    remarks: string | null
  }>
}

export function VersionHistory({ versions }: VersionHistoryProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="history" className="border-none">
        <AccordionTrigger className="hover:no-underline py-3 px-1 text-sm font-semibold text-slate-800">
          Version History ({versions.length})
        </AccordionTrigger>
        <AccordionContent className="pb-4 pt-1 px-1">
          <div className="space-y-3">
            {versions.map((v, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">v{v.version}</span>
                    <span className="text-xs text-slate-500">{v.createdAt || v.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={v.status} size="sm" />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {v.remarks && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded italic">
                    &ldquo;{v.remarks}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
