"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LogbookCard } from "@/components/logbook/LogbookCard"
import { useLogbook } from "@/hooks/useLogbook"

export default function FacultyLogbookPage() {
  const { data: logbook = [], isLoading } = useLogbook()
  const pendingCount = logbook.filter(e => e.status === "PENDING" && e.type === "INCOMING").length

  return (
    <>
      <PageHeader
        title="My Logbook"
        subtitle="Track your incoming and outgoing documents"
        actions={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        }
      />

      <div className="space-y-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex gap-2">
              All Entries
              <span className="bg-slate-200 text-slate-700 text-xs px-1.5 rounded-full">{logbook.length}</span>
            </TabsTrigger>
            <TabsTrigger value="action-needed" className="flex gap-2">
              Action Needed
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs px-1.5 rounded-full">{pendingCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search your logs..." className="pl-9 h-9" />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <Button variant="ghost" size="sm" className="h-7 text-xs bg-white shadow-sm">All</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">Incoming</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">Outgoing</Button>
            </div>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Status</Button>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Date Range</Button>
          </div>

          <TabsContent value="all" className="space-y-3 mt-0">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
                Loading logbook entries...
              </div>
            ) : logbook.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
                No entries found.
              </div>
            ) : (
              logbook.map((entry) => (
                <LogbookCard
                  key={entry.id}
                  entry={entry}
                  role="faculty"
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="action-needed" className="space-y-3 mt-0">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
                Loading logbook entries...
              </div>
            ) : logbook.filter(e => e.status === "PENDING" && e.type === "INCOMING").length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
                No pending actions needed.
              </div>
            ) : (
              logbook.filter(e => e.status === "PENDING" && e.type === "INCOMING").map((entry) => (
                <LogbookCard
                  key={entry.id}
                  entry={entry}
                  role="faculty"
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
