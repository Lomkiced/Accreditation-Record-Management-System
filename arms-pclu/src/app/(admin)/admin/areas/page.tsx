"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AreaCard } from "@/components/areas/AreaCard"
import { AreaFormModal } from "@/components/areas/AreaFormModal"

const mockAreas = [
  { id: "1", number: 1, name: "Purposes and Objectives", criteriaCount: 4, completion: 100 },
  { id: "2", number: 2, name: "Faculty", criteriaCount: 8, completion: 65 },
  { id: "3", number: 3, name: "Instruction", criteriaCount: 5, completion: 0 },
]

export default function AreasPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  return (
    <>
      <PageHeader
        title="Accreditation Areas"
        subtitle="Manage PACUCOA areas, criteria, and indicators"
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Area
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search areas by name or number..." 
            className="pl-10 h-10 w-full bg-white border-slate-200"
          />
        </div>

        <div className="space-y-3">
          {mockAreas.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      </div>

      <AreaFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
