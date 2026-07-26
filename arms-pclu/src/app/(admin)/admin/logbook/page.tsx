"use client"

import * as React from "react"
import { Download, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LogbookCard } from "@/components/logbook/LogbookCard"
import { useLogbook } from "@/hooks/useLogbook"

export default function AdminLogbookPage() {
  const { data: logbook = [], isLoading } = useLogbook()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "INCOMING" | "OUTGOING">("ALL")
  
  const filteredLogbook = React.useMemo(() => {
    return logbook.filter((entry) => {
      // Search
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        !q || 
        entry.title.toLowerCase().includes(q) || 
        entry.user.name.toLowerCase().includes(q)
        
      // Type
      const matchesType = typeFilter === "ALL" || entry.type === typeFilter
      
      return matchesSearch && matchesType
    })
  }, [logbook, searchQuery, typeFilter])

  const pendingCount = filteredLogbook.filter(e => e.status === "PENDING").length
  


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
              <span className="bg-slate-200 text-slate-700 text-xs px-1.5 rounded-full">{filteredLogbook.length}</span>
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
              <Input 
                placeholder="Search logs..." 
                className="pl-9 h-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-7 text-xs ${typeFilter === "ALL" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}`}
                onClick={() => setTypeFilter("ALL")}
              >All</Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-7 text-xs ${typeFilter === "INCOMING" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}`}
                onClick={() => setTypeFilter("INCOMING")}
              >Incoming</Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-7 text-xs ${typeFilter === "OUTGOING" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}`}
                onClick={() => setTypeFilter("OUTGOING")}
              >Outgoing</Button>
            </div>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Status</Button>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Faculty</Button>
            <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Date Range</Button>
          </div>

          <TabsContent value="all" className="space-y-3 mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredLogbook.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
                No entries found.
              </div>
            ) : (
              filteredLogbook.map((entry) => (
                <LogbookCard key={entry.id} entry={entry} role="admin" />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-3 mt-0">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
                Loading logbook entries...
              </div>
            ) : filteredLogbook.filter(e => e.status === "PENDING").length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
                No pending entries.
              </div>
            ) : (
              filteredLogbook.filter(e => e.status === "PENDING").map((entry) => (
                <LogbookCard key={entry.id} entry={entry} role="admin" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
