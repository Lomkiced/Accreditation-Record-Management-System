import Link from "next/link"
import {
  Archive,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  ActivitySquare,
  FileText,
  ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/dashboard/StatCard"
import { ComplianceChart } from "@/components/dashboard/ComplianceChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { HierarchicalDrillDown } from "@/components/dashboard/HierarchicalDrillDown"
import {
  getDashboardStats,
  getPendingSubmissions,
  getRecentAuditLogs,
} from "@/actions/dashboard.actions"
import { requireAdmin } from "@/lib/auth/getUser"

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
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

// ─── Audit action label map ───────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  UPLOAD_DOCUMENT:        "Uploaded a document",
  CREATE_EVIDENCE_MAPPINGS: "Tagged evidence to indicators",
  SUBMIT_MAPPING:         "Submitted a mapping for review",
  SUBMIT_ALL_MAPPINGS:    "Submitted all mappings",
  REVIEW_MAPPING:         "Reviewed a mapping",
  DELETE_MAPPING:         "Deleted a mapping",
}

// ─── Dashboard Page (Async Server Component) ──────────────────────────────────

export default async function AdminDashboardPage() {
  // Route protection — throws redirect if not admin
  const admin = await requireAdmin()

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Parallel data fetching — all three queries run simultaneously
  const [stats, pendingSubmissions, recentLogs] = await Promise.all([
    getDashboardStats(),
    getPendingSubmissions(),
    getRecentAuditLogs(),
  ])

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${admin.name}`}
        actions={<span className="text-sm text-slate-500 font-medium">{currentDate}</span>}
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Documents"
          value={stats.totalDocuments}
          subtitle="In central repository"
          icon={Archive}
          color="blue"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          subtitle="Awaiting your evaluation"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Compliance Rate"
          value={`${stats.compliancePercent}%`}
          subtitle={`${stats.approvedMappings} approved mappings`}
          icon={TrendingUp}
          color="emerald"
          trend={
            stats.compliancePercent > 0
              ? { value: `${stats.compliancePercent}%`, isPositive: true }
              : undefined
          }
        />
        <StatCard
          title="Active Faculty"
          value={stats.activeFaculty}
          subtitle="Contributing members"
          icon={Users}
          color="blue"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          <ComplianceChart />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* ── Hierarchical Evidence Drill-Down ── */}
      <div className="mb-6">
        <HierarchicalDrillDown />
      </div>

      {/* ── Bottom Row: Pending Submissions + Recent Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Pending Submissions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              Pending Submissions
              {stats.pendingReviews > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold">
                  {stats.pendingReviews}
                </span>
              )}
            </h3>
          </div>

          <div className="flex-1 overflow-x-auto">
            {pendingSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No submissions awaiting review.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Faculty</th>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      {/* Document */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate text-xs">
                              {sub.document.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {sub.indicator.criterion.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Faculty */}
                      <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">
                        {sub.user.name}
                      </td>
                      {/* Area */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {sub.indicator.criterion.area.name}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusPill status={sub.status} />
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link
              href="/admin/submissions"
              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              View all submissions
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <ActivitySquare className="w-4 h-4 text-slate-400" />
              Recent Activity
            </h3>
          </div>

          <div className="flex-1">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No activity yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  System events will appear here as faculty and admins perform actions.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentLogs.map((log) => {
                  const docTitle =
                    log.details != null && typeof log.details.documentTitle === "string"
                      ? log.details.documentTitle
                      : null
                  return (
                  <li key={log.id} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ActivitySquare className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">
                        <span className="font-semibold">{log.user.name}</span>{" "}
                        <span className="text-slate-500">
                          {ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, " ")}
                        </span>
                      </p>
                      {docTitle && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {docTitle}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      {log.module}
                    </span>
                  </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link
              href="/admin/audit-logs"
              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              View full audit log
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}
