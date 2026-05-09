"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { cn } from "@/lib/utils"

const myAreas = [
  { id: "1", number: 2, name: "Faculty", criteriaAssigned: ["A. Academic Qualifications", "B. Professional Performance"], completion: 60, nextDeadline: "Oct 20, 2024" },
  { id: "2", number: 4, name: "Library", criteriaAssigned: ["B. Collection"], completion: 20, nextDeadline: "Nov 05, 2024" },
]

export default function MyAreasPage() {
  const COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
  ]

  return (
    <>
      <PageHeader
        title="My Assigned Areas"
        subtitle="Manage and upload documents for your assigned PAASCU areas"
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search assigned areas or criteria..." className="pl-9 h-9" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {myAreas.map((area) => {
            const colorClass = COLORS[(area.number - 1) % COLORS.length]
            const completionClass =
              area.completion === 100
                ? "w-full"
                : area.completion === 60
                  ? "w-[60%]"
                  : area.completion === 20
                    ? "w-[20%]"
                    : "w-0"

            return (
              <Link key={area.id} href={`/my-areas/${area.id}`} className="block">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 hover:border-blue-300 group h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${colorClass}`}>
                      {area.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600 transition-colors truncate">
                        {area.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {area.criteriaAssigned.length} Criteria Assigned
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        Due: {area.nextDeadline}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 mb-4 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assigned Criteria:</p>
                    <ul className="space-y-1">
                      {area.criteriaAssigned.map((c, i) => (
                        <li key={i} className="text-sm text-slate-700 truncate flex items-center gap-2">
                          <span className="w-1 h-1 bg-slate-400 rounded-full shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                      <span>Overall Progress</span>
                      <span>{area.completion}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={cn("h-full bg-blue-500 transition-all duration-500", completionClass)} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
