"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Clock, AlertCircle, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/dashboard/StatCard"
import { LogbookCard } from "@/components/logbook/LogbookCard"

export default function FacultyDashboardPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      <PageHeader
        title="Faculty Portal"
        subtitle="Welcome back, Dr. Juan Perez"
        actions={<span className="text-sm text-slate-500 font-medium">{currentDate}</span>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="My Areas"
          value={2}
          subtitle="Assigned PAASCU areas"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Pending Documents"
          value={5}
          subtitle="Needs submission"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Under Review"
          value={1}
          subtitle="Awaiting admin approval"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completion Rate"
          value="45%"
          subtitle="My overall progress"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800">My Active Assignments</h3>
          </div>
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {i === 1 ? '2' : '4'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {i === 1 ? 'Area 2: Faculty' : 'Area 4: Library'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {i === 1 ? 'A. Academic Qualifications' : 'B. Collection'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-slate-500">Progress: {i === 1 ? '60%' : '20%'}</span>
                  <div className="w-1/2 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={i === 1 ? "h-full bg-blue-500 w-[60%]" : "h-full bg-blue-500 w-[20%]"} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/faculty/my-areas" className="text-xs text-blue-600 hover:underline font-medium">
              View all assignments
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800">Recent Logbook Entries</h3>
            <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold">1 Action Required</span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            <LogbookCard 
              role="faculty"
              entry={{
                id: "1",
                type: "INCOMING",
                title: "Memo on Updated Syllabus Format",
                refNo: "MEMO-2024-045",
                fromTo: "Received from Admin",
                purpose: "Guidelines for the new syllabus format.",
                date: "Oct 12, 2024",
                faculty: "Dr. Juan Perez",
                status: "PENDING",
                hasAttachment: true,
              }}
            />
            <LogbookCard 
              role="faculty"
              entry={{
                id: "2",
                type: "OUTGOING",
                title: "Submitted Faculty Profile",
                fromTo: "Sent to Admin",
                purpose: "Updated profile for AY 2024-2025",
                date: "Oct 10, 2024",
                faculty: "Dr. Juan Perez",
                status: "ACKNOWLEDGED",
                hasAttachment: true,
                acknowledgedDate: "Oct 11, 2024"
              }}
            />
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/faculty/my-logbook" className="text-xs text-blue-600 hover:underline font-medium">
              View full logbook
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
