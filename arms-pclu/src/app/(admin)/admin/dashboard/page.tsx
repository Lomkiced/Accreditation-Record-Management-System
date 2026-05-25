"use client"

import * as React from "react"
import Link from "next/link"
import { Archive, Clock, TrendingUp, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/dashboard/StatCard"
import { ComplianceChart } from "@/components/dashboard/ComplianceChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { HierarchicalDrillDown } from "@/components/dashboard/HierarchicalDrillDown"

const mockSubmissions = [
  { id: 1, faculty: "Juan Perez", area: "Area 2", date: "Oct 12, 2024", status: "PENDING" },
  { id: 2, faculty: "Maria Clara", area: "Area 4", date: "Oct 11, 2024", status: "PENDING" },
  { id: 3, faculty: "Pedro Penduko", area: "Area 1", date: "Oct 10, 2024", status: "PENDING" },
]

const mockLogbook = [
  { id: 1, type: "INCOMING", title: "Memo 123", faculty: "Admin", date: "Oct 12, 2024" },
  { id: 2, type: "OUTGOING", title: "Report Q3", faculty: "Admin", date: "Oct 11, 2024" },
]

export default function AdminDashboardPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Admin User"
        actions={<span className="text-sm text-slate-500 font-medium">{currentDate}</span>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Documents"
          value={1248}
          subtitle="+12 this week"
          icon={Archive}
          color="blue"
          trend={{ value: "1.2%", isPositive: true }}
        />
        <StatCard
          title="Pending Reviews"
          value={34}
          subtitle="Awaiting your review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Compliance Rate"
          value="82%"
          subtitle="Overall readiness"
          icon={TrendingUp}
          color="emerald"
          trend={{ value: "4.5%", isPositive: true }}
        />
        <StatCard
          title="Active Faculty"
          value={45}
          subtitle="Contributing members"
          icon={Users}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          <ComplianceChart />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* Hierarchical Evidence Drill-Down — Area → Criterion → Indicator → Documents */}
      <div className="mb-6">
        <HierarchicalDrillDown />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              Pending Submissions
              <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold">
                {mockSubmissions.length}
              </span>
            </h3>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Faculty</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{sub.faculty}</td>
                    <td className="px-4 py-3 text-slate-600">{sub.area}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{sub.date}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/admin/submissions" className="text-xs text-blue-600 hover:underline font-medium">
              View all submissions
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              Pending Acknowledgments
              <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold">
                {mockLogbook.length}
              </span>
            </h3>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockLogbook.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <StatusBadge status={log.type} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{log.title}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.date}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        Acknowledge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/admin/logbook" className="text-xs text-blue-600 hover:underline font-medium">
              View all logbook entries
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
