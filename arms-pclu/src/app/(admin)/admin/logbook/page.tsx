"use client"

import * as React from "react"
import { Download, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LogbookCard, type LogEntry } from "@/components/logbook/LogbookCard"

const mockLogbook: LogEntry[] = [
  {
    id: "1",
    type: "INCOMING",
    title: "Memo on Updated Syllabus Format",
    refNo: "MEMO-2024-045",
    fromTo: "Received from Dean's Office",
    purpose: "Guidelines for the new syllabus format for AY 2024-2025.",
    date: "Oct 12, 2024",
    faculty: "Dr. Juan Perez",
    status: "PENDING",
    hasAttachment: true,
  },
  {
    id: "2",
    type: "OUTGOING",
    title: "Request for Lab Equipment Validation",
    fromTo: "Sent to Quality Assurance Office",
    purpose: "Validation of new computer laboratory units for IT students.",
    date: "Oct 11, 2024",
    faculty: "Maria Clara",
    status: "ACKNOWLEDGED",
    hasAttachment: false,
    acknowledgedDate: "Oct 12, 2024",
  },
  {
    id: "3",
    type: "INCOMING",
    title: "PAASCU Self-Survey Guide",
    fromTo: "Received from PAASCU Secretriat",
    purpose: "Official guide for conducting the self-survey.",
    date: "Oct 10, 2024",
    faculty: "Elena Santos",
    status: "REJECTED",
    hasAttachment: true,
    remarks: "Incorrect document version attached. Please resubmit.",
  },
]

export default function AdminLogbookPage() {
  const pendingCount = mockLogbook.filter(e => e.status === "PENDING").length

  return (
    <>
      <PageHeader
        title="Document Logbook"
        subtitle="Incoming and outgoing accreditation document records"
        actions={
          <Button variant="outline" className="text-slate-700 bg-white">
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        }
      />

      <div className="space-y-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex gap-2">
              All Entries
              <span className="bg-slate-200 text-slate-700 text-xs px-1.5 rounded-full">{mockLogbook.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex gap-2">
              Pending Acknowledgment
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs px-1.5 rounded-full">{pendingCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search logs..." className="pl-9 h-9" />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <Button variant="ghost" size="sm" className="h-7 text-xs bg-white shadow-sm">All</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">Incoming</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">Outgoing</Button>
            </div>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Status</Button>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Faculty</Button>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Date Range</Button>
          </div>

          <TabsContent value="all" className="space-y-3 mt-0">
            {mockLogbook.map((entry) => (
              <LogbookCard key={entry.id} entry={entry} role="admin" />
            ))}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-3 mt-0">
            {mockLogbook.filter(e => e.status === "PENDING").map((entry) => (
              <LogbookCard key={entry.id} entry={entry} role="admin" />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
