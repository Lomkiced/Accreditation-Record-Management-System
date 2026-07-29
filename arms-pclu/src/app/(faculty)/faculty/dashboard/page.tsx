"use client"

import * as React from "react"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { 
  FileText, Clock, AlertCircle, TrendingUp, CheckCircle2, 
  ChevronRight, ArrowRight, BookOpen, Activity, AlertTriangle 
} from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { useAssignments } from "@/hooks/useAssignments"
import { useAreas } from "@/hooks/useAreas"
import { useMySubmissions } from "@/hooks/useSubmissions"
import { formatDistanceToNow } from "date-fns"

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

export default function FacultyDashboardPage() {
  const { user } = useAuthStore()
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useAssignments(user?.id ?? "")
  const { data: areas = [], isLoading: isAreasLoading } = useAreas()
  const { data: submissions = [], isLoading: isSubmissionsLoading } = useMySubmissions()

  const myAreasCount = new Set(assignments.map(a => a.areaId)).size
  const underReviewCount = submissions.filter(s => s.status === "SUBMITTED").length
  const approvedDocsCount = submissions.filter(s => s.status === "APPROVED").length

  let totalIndicators = 0
  let approvedIndicators = 0
  let submittedIndicators = 0

  const groupedAssignments = React.useMemo(() => {
    const map = new Map<string, {
      areaId: string
      areaName: string
      areaOrder: number
      criteriaAssigned: { id: string, name: string }[]
    }>()

    assignments.forEach(a => {
      if (!map.has(a.areaId)) {
        map.set(a.areaId, {
          areaId: a.areaId,
          areaName: a.area.name,
          areaOrder: a.area.order,
          criteriaAssigned: []
        })
      }
      if (a.criterionId && a.criterion) {
        map.get(a.areaId)!.criteriaAssigned.push({ id: a.criterion.id, name: a.criterion.name })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.areaOrder - b.areaOrder)
  }, [assignments])

  groupedAssignments.forEach(group => {
    const fullArea = areas.find(a => a.id === group.areaId)
    if (fullArea) {
      fullArea.criteria.forEach(c => {
        if (group.criteriaAssigned.length === 0 || group.criteriaAssigned.some(assigned => assigned.id === c.id)) {
          totalIndicators += c.indicators.length
          c.indicators.forEach(ind => {
            const hasApproved = submissions.some(sub => sub.indicator.id === ind.id && sub.status === "APPROVED")
            const hasSubmitted = submissions.some(sub => sub.indicator.id === ind.id && sub.status === "SUBMITTED")
            if (hasApproved) approvedIndicators++
            if (hasSubmitted) submittedIndicators++
          })
        }
      })
    }
  })

  const completionRate = totalIndicators === 0 ? 0 : Math.round((approvedIndicators / totalIndicators) * 100)
  
  // Combine and sort recent activity (Logbook + Submissions)
  const recentActivity = React.useMemo(() => {
    const activity: {
      id: string; type: string; title: string; status: string; date: Date; link: string; isPending: boolean;
    }[] = []
    
    submissions.forEach(s => {
      activity.push({
        id: `sub-${s.id}`,
        type: 'submission',
        title: s.document?.title || "Document Submission",
        status: s.status,
        date: new Date(s.updatedAt),
        link: '/faculty/my-areas', // generic link since specific document mapping might need deep linking
        isPending: s.status === "RETURNED"
      })
    })
    return activity.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)
  }, [submissions])

  const isLoading = isAssignmentsLoading || isAreasLoading || isSubmissionsLoading

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
                Welcome back, {user?.name?.split(' ')[0] ?? "Faculty"}
              </h1>
              <p className="text-blue-100/90 max-w-xl text-base md:text-lg leading-relaxed mt-2 font-light">
                You have <strong className="text-white font-semibold">{underReviewCount} documents</strong> currently under review.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 min-w-[280px] lg:min-w-[320px] shadow-2xl">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-semibold text-blue-100">Overall Completion</span>
                <span className="text-3xl font-black text-white tracking-tighter">{completionRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-blue-950/40 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-white rounded-full" 
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5 text-blue-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div> {approvedIndicators} Approved
                </div>
                <div className="text-blue-200/80">{totalIndicators} Total Indicators</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS ROW */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Assigned Areas</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{myAreasCount}</h3>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <BookOpen size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">
              PACUCOA areas to manage
            </p>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-amber-300 transition-all hover:shadow-md relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Under Review</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{underReviewCount}</h3>
              </div>
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <AlertTriangle size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium relative z-10">
              Pending logbooks/returns
            </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-violet-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Under Review</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{underReviewCount}</h3>
              </div>
              <div className="p-3.5 bg-violet-50 text-violet-600 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                <Clock size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">
              Awaiting admin approval
            </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-emerald-300 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Approved Docs</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{approvedDocsCount}</h3>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-5 font-medium">
              Successfully approved
            </p>
          </div>
        </motion.div>

        {/* MAIN BENTO GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Active Assignments Progress (Spans 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col max-h-[600px]">
            <div className="p-8 pb-4 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={22} className="text-blue-600" />
                  Submission Progress
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Track your document completion per area.</p>
              </div>
              <Link href="/faculty/my-areas" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex-1 p-6 pt-2 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="space-y-6">
                   {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-5 p-2">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-4 bg-slate-100 rounded w-10"></div>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedAssignments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <BookOpen size={40} className="text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500">No areas assigned to you yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedAssignments.map((group) => {
                    let localTotal = 0
                    let localApproved = 0
                    let localSubmitted = 0
                    const fullArea = areas.find(a => a.id === group.areaId)
                    
                    if (fullArea) {
                      fullArea.criteria.forEach(c => {
                        if (group.criteriaAssigned.length === 0 || group.criteriaAssigned.some(assigned => assigned.id === c.id)) {
                          localTotal += c.indicators.length
                          c.indicators.forEach(ind => {
                            if (submissions.some(sub => sub.indicator.id === ind.id && sub.status === "APPROVED")) localApproved++
                            if (submissions.some(sub => sub.indicator.id === ind.id && sub.status === "SUBMITTED")) localSubmitted++
                          })
                        }
                      })
                    }
                    
                    const percentApproved = localTotal === 0 ? 0 : (localApproved / localTotal) * 100
                    const percentSubmitted = localTotal === 0 ? 0 : (localSubmitted / localTotal) * 100

                    return (
                      <Link href={`/faculty/my-areas/${group.areaId}`} key={group.areaId} className="block group">
                        <div className="flex items-start gap-5 p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">

                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-center mb-3">
                              <div className="pr-4 overflow-hidden">
                                <h4 className="text-[15px] font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                  {group.areaName}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                  {group.criteriaAssigned.length === 0 ? "All Criteria Assigned" : `${group.criteriaAssigned.length} Criteria Assigned`}
                                </p>
                              </div>
                              <span className="text-sm font-black text-slate-700 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-800 px-3 py-1 rounded-lg transition-colors">
                                {Math.round(percentApproved)}%
                              </span>
                            </div>
                            
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentApproved}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-emerald-500 rounded-r-full" 
                              />
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentSubmitted}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="h-full bg-amber-400 rounded-r-full" 
                              />
                            </div>
                            
                            <div className="flex items-center gap-5 mt-3 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> {localApproved} Apprv</span>
                              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div> {localSubmitted} Rev</span>
                              <span className="flex items-center gap-1.5 ml-auto text-slate-400">{localTotal} Total</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline (Spans 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col max-h-[600px]">
            <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={22} className="text-violet-600" />
                  Recent Activity
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Logbooks & submissions.</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 p-2">
                      <div className="w-1.5 h-12 bg-slate-100 rounded-full"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <Clock size={40} className="text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500">No recent activity found.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-2">
                  {recentActivity.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-6 group"
                    >
                      <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125 ${
                        activity.isPending ? 'bg-amber-500' :
                        activity.status === 'APPROVED' || activity.status === 'ACKNOWLEDGED' ? 'bg-emerald-500' :
                        activity.type === 'logbook' ? 'bg-blue-500' : 'bg-slate-300'
                      }`}></div>
                      
                      <Link href={activity.link} className="block p-4 -mt-2 rounded-2xl bg-white hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h4 className={`text-[14px] font-bold leading-snug line-clamp-2 ${activity.isPending ? 'text-amber-700' : 'text-slate-800 group-hover:text-blue-700'}`}>
                            {activity.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg ${
                            activity.status === 'PENDING' ? 'bg-slate-100 text-slate-600' :
                            activity.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700' :
                            activity.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700' :
                            activity.status === 'APPROVED' || activity.status === 'ACKNOWLEDGED' ? 'bg-emerald-50 text-emerald-700' :
                            activity.status === 'RETURNED' || activity.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {activity.status.replace('_', ' ')}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {formatDistanceToNow(activity.date, { addSuffix: true })}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize font-medium mt-0.5">
                              {activity.type}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem] text-center">
              <Link href="/faculty/notifications" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                View Timeline <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
        </motion.div>
      </motion.div>

      {/* Global CSS for custom scrollbar hidden in normal but present when hovering, to keep UI clean */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
        }
      `}} />
    </div>
  )
}
