"use client"

import * as React from "react"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import {
  Archive,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  ActivitySquare,
  FileText,
  ChevronRight,
  BarChart3,
  TrendingUp,
  ArrowRight
} from "lucide-react"

import { StatCard } from "@/components/dashboard/StatCard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { HierarchicalDrillDown } from "@/components/dashboard/HierarchicalDrillDown"

import type { DashboardStats, PendingSubmission, RecentAuditLog } from "@/actions/dashboard.actions"

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

const ACTION_LABELS: Record<string, string> = {
  UPLOAD_DOCUMENT:        "Uploaded a document",
  CREATE_EVIDENCE_MAPPINGS: "Tagged evidence to indicators",
  SUBMIT_MAPPING:         "Submitted a mapping for review",
  SUBMIT_ALL_MAPPINGS:    "Submitted all mappings",
  REVIEW_MAPPING:         "Reviewed a mapping",
  DELETE_MAPPING:         "Deleted a mapping",
}

interface DeanDashboardClientProps {
  stats: DashboardStats
  pendingSubmissions: PendingSubmission[]
  recentLogs: RecentAuditLog[]
  dean: { name: string }
  currentDate: string
}

export function DeanDashboardClient({
  stats,
  pendingSubmissions,
  recentLogs,
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
        {/* HERO SECTION */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-900/10">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          
          <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <p className="text-blue-100 font-medium tracking-wide text-sm uppercase">{currentDate}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Welcome back, {dean?.name?.split(' ')[0] ?? "Dean"}
              </h1>
              <p className="text-blue-100/90 max-w-xl text-base md:text-lg leading-relaxed mt-2 font-light">
                You have <strong className="text-white font-semibold">{stats.pendingReviews} pending reviews</strong> requiring your evaluation today.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 min-w-[280px] lg:min-w-[320px] shadow-2xl">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-semibold text-blue-100">Overall Compliance</span>
                <span className="text-3xl font-black text-white tracking-tighter">{stats.compliancePercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-blue-950/40 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.compliancePercent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-white rounded-full" 
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5 text-blue-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div> {stats.approvedMappings} Approved
                </div>
                <div className="text-blue-200/80">{stats.totalDocuments} Documents</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS ROW */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Total Documents</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.totalDocuments}</h3>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Archive size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">In central repository</p>
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

          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-emerald-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Overall Compliance</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.compliancePercent}%</h3>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">Target completion</p>
          </div>
        </motion.div>

        {/* MAIN BENTO GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Middle Section (Spans 8 cols) - Submissions & Area breakdown */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Hierarchical Drill Down */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 lg:p-8 flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 size={22} className="text-blue-600" />
                    Compliance Progress
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Track your department&apos;s compliance per area.</p>
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-2">
                <HierarchicalDrillDown showPercentages={false} />
              </div>
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

          </div>

          {/* Right Section (Spans 4 cols) - Recent Activity & Compliance Chart */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 pb-2">
               <ActivityFeed />
            </div>

            {/* Recent System Activity */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col flex-1 max-h-[500px]">
              <div className="p-6 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ActivitySquare className="w-5 h-5 text-indigo-600" />
                  Recent Activity
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {recentLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      <AlertCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No activity yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2 p-2 pt-0">
                    {recentLogs.map((log) => {
                      const docTitle = log.details != null && typeof log.details.documentTitle === "string" ? log.details.documentTitle : null
                      return (
                      <li key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                          <ActivitySquare className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">
                            <span className="font-bold">{log.user.name}</span>{" "}
                            <span className="text-slate-600 text-xs">
                              {ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </p>
                          {docTitle && (
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate bg-slate-100 px-2 py-0.5 rounded-md inline-block max-w-full">
                              {docTitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                              {log.module}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center rounded-b-[2rem]">
                <Link
                  href="/dean/audit-logs"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide uppercase inline-flex items-center gap-1 group transition-colors"
                >
                  Full Audit Log
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>

        </motion.div>
      </motion.div>
    </div>
  )
}
