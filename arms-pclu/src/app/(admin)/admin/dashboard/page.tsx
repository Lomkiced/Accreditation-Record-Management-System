import {
  Archive,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  FileText,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/dashboard/StatCard"
import { HierarchicalDrillDown } from "@/components/dashboard/HierarchicalDrillDown"
import {
  getDashboardStats,
  getPendingSubmissions,
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

  // Parallel data fetching
  const [stats, pendingSubmissions] = await Promise.all([
    getDashboardStats(),
    getPendingSubmissions(),
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
          title="Approved Documents"
          value={stats.totalDocuments}
          subtitle="With at least one approval"
          icon={Archive}
          color="blue"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          subtitle="Awaiting evaluation"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Compliance Rate"
          value={`${stats.compliancePercent}%`}
          subtitle={`${stats.approvedMappings} indicators met`}
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

      {/* ── Pending Submissions Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Pending Submissions
              {stats.pendingReviews > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold ml-1">
                  {stats.pendingReviews}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Documents awaiting your review</p>
          </div>
        </div>

        <div className="flex-1">
          {pendingSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">
                No submissions are currently awaiting review.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingSubmissions.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {sub.document.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      <span className="font-medium text-slate-600">{sub.user.name}</span>
                      {" · "}
                      {sub.indicator.criterion.area.name}
                      {" › "}
                      {sub.indicator.criterion.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(sub.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <StatusPill status={sub.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Hierarchical Evidence Drill-Down ── */}
      <div className="mb-6">
        <HierarchicalDrillDown />
      </div>
    </>
  )
}
