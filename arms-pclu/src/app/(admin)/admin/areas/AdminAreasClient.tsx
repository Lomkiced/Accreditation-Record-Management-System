"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AreaCard } from "@/components/areas/AreaCard"
import { AreaFormModal } from "@/components/areas/AreaFormModal"
import { useAreas } from "@/hooks/useAreas"
import type { getAreas } from "@/actions/area.actions"

type AreasData = Extract<Awaited<ReturnType<typeof getAreas>>, { success: true }>["data"]

export function AdminAreasClient({ initialData }: { initialData: AreasData }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const { data: areas = [], isLoading } = useAreas(initialData)

  const filteredAreas = areas.filter(area => 
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <PageHeader
        title="Accreditation Areas"
        subtitle="Manage PACUCOA areas, sub-areas, and indicators"
        actions={null}
      />

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search areas by name..." 
            className="pl-10 h-10 w-full bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {isLoading && areas.length === 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
              No areas found.
            </div>
          ) : (
            filteredAreas.map((area) => (
              <AreaCard key={area.id} area={area} mode="admin" />
            ))
          )}
        </div>
      </div>

      <AreaFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
