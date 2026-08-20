"use client"

import * as React from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, Variants } from "framer-motion"
import {
  Archive,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  BarChart3,
  ArrowRight
} from "lucide-react"

// ── Lazy-load data-fetching dashboard widgets ──────────────────────────────
// These components have their own TanStack Query hooks and render heavy UI.
// Loading them dynamically keeps the initial DeanDashboard JS chunk smaller.
const ActivityFeed = dynamic(
  () => import("@/components/dashboard/ActivityFeed").then((m) => ({ default: m.ActivityFeed })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-slate-400 animate-pulse">Loading activity…</p>
      </div>
    ),
  }
)

const ProgressByArea = dynamic(
  () => import("@/components/dashboard/ProgressByArea").then((m) => ({ default: m.ProgressByArea })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-slate-400 animate-pulse">Loading progress…</p>
      </div>
    ),
  }
)

import type { DashboardStats, PendingSubmission } from "@/actions/dashboard.actions"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:        { label: "Draft",        className: "bg-slate-100 text-slate-600" },
  SUBMITTED:    { label: "Submitted",    className: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-amber-100 text-amber-700" },
  APPROVED:     { label: "Approved",     className: "bg-emerald-100 text-emerald-700" },
  RETURNED:     { label: "Returned",     className: "bg-red-100 text-red-700" },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SUBMITTED
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}


interface DeanDashboardClientProps {
  stats: DashboardStats
  pendingSubmissions: PendingSubmission[]
  dean: { name: string }
  currentDate: string
}

export function DeanDashboardClient({
  stats,
  pendingSubmissions,
  dean,
  currentDate,
}: DeanDashboardClientProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-4 md:p-6 lg:p-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto space-y-6"
      >
        {/* HERO SECTION — No compliance card */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-900/10">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          
          <div className="relative p-8 md:p-10">
            <div className="space-y-2">
              <p className="text-blue-100 font-medium tracking-wide text-sm uppercase">{currentDate}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Welcome back, {dean?.name?.split(' ')[0] ?? "Dean"}
              </h1>
              <p className="text-blue-100/90 max-w-xl text-base md:text-lg leading-relaxed mt-2 font-light">
                You have <strong className="text-white font-semibold">{stats.pendingReviews} pending reviews</strong> requiring your evaluation today.
              </p>
            </div>
          </div>
        </motion.div>

        {/* STATS ROW — 3 cards, no Overall Compliance */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Approved Documents</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.totalDocuments}</h3>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Archive size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">With at least one approval</p>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-amber-300 transition-all hover:shadow-md relative overflow-hidden">
            {stats.pendingReviews > 0 && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-0"></div>}
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Pending Reviews</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.pendingReviews}</h3>
              </div>
              <div className={`p-3.5 rounded-2xl transition-all shadow-sm ${stats.pendingReviews > 0 ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white animate-pulse' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-200'}`}>
                <Clock size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium relative z-10">Awaiting your evaluation</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-violet-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Active Faculty</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.activeFaculty}</h3>
              </div>
              <div className="p-3.5 bg-violet-50 text-violet-600 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                <Users size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">Contributing members</p>
          </div>
        </motion.div>

        {/* MAIN BENTO GRID */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          
          {/* Progress by Area & Pending Submissions */}
            
            {/* Progress by Area — New Component */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 lg:p-8 flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 size={22} className="text-blue-600" />
                    Progress by Area
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Track your department&apos;s compliance per area.</p>
                </div>
              </div>
              <ProgressByArea />
            </div>

            {/* Pending Submissions */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden max-h-[500px]">
              <div className="p-6 lg:p-8 pb-4 flex items-center justify-between border-b border-slate-100 bg-white">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={22} className="text-amber-600" />
                    Pending Submissions
                    {stats.pendingReviews > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold ml-2">
                        {stats.pendingReviews}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Documents waiting for your review.</p>
                </div>
                <Link
                  href="/dean/submissions"
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                >
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {pendingSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 shadow-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-base font-bold text-slate-700">All caught up!</p>
                    <p className="text-sm text-slate-500 mt-1">No submissions awaiting review.</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4 pt-2">
                    {pendingSubmissions.map((sub) => (
                      <div key={sub.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md hover:bg-slate-50 transition-all">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700 transition-colors">
                              {sub.document.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700">{sub.user.name}</span>
                              <span className="text-slate-300">•</span>
                              <span className="truncate">{sub.indicator.criterion.name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 sm:flex-col sm:items-end sm:gap-1">
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                            {sub.indicator.criterion.area.name}
                          </span>
                          <StatusPill status={sub.status} />
                          <span className="text-[10px] font-medium text-slate-400 mt-1">
                            {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

        </motion.div>
      </motion.div>
    </div>
  )
}

