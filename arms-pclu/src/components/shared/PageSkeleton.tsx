import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

// ─── Stat Cards Row ───────────────────────────────────────────────────────────

function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
        >
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  )
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-xs" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <div className="ml-auto">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex gap-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32 ml-auto" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-4 border-b border-slate-50 last:border-0 flex items-center gap-4"
        >
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// ─── Cards Grid Skeleton ──────────────────────────────────────────────────────

function CardsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm"
        >
          <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel Skeleton (assignments, side panel style) ───────────────────────────

function PanelSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4 h-[calc(100vh-180px)]">
      {/* Left list */}
      <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Notification List Skeleton ───────────────────────────────────────────────

function NotificationSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="px-5 py-4 border-b border-slate-50 last:border-0 flex gap-4"
        >
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-3 w-16 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─── Profile Skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-36 mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-lg mt-4" />
      </div>
    </div>
  )
}

// ─── Dashboard Skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton({ statCount = 4 }: { statCount?: number }) {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton count={statCount} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-[340px] flex flex-col">
          <Skeleton className="h-5 w-56 mb-2" />
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="flex-1 flex items-end gap-3 pb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-lg"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <Skeleton className="h-5 w-36 mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 border-b border-slate-50">
              <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Logbook Skeleton ─────────────────────────────────────────────────────────

function LogbookSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-50 last:border-0 flex gap-4 items-start">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Repository Skeleton ──────────────────────────────────────────────────────

function RepositorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-24" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-16 rounded-full ml-2" />
            <div className="ml-auto">
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Reports Skeleton ─────────────────────────────────────────────────────────

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-64">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="flex items-end gap-2 h-40">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="flex-1 rounded-t"
                  style={{ height: `${40 + Math.random() * 50}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tags Skeleton ─────────────────────────────────────────────────────────────

function TagsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-50 last:border-0 flex items-center gap-4">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Area Detail Skeleton ─────────────────────────────────────────────────────

function AreaDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <Skeleton className="h-5 w-56" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── My Areas Skeleton (Faculty) ──────────────────────────────────────────────

function MyAreasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Archives Skeleton ────────────────────────────────────────────────────────

function ArchivesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-50 last:border-0 flex gap-4 items-start">
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page Header Skeleton ─────────────────────────────────────────────────────

function PageHeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      {hasAction && <Skeleton className="h-10 w-36" />}
    </div>
  )
}

// ─── Spinner Center ───────────────────────────────────────────────────────────

function SpinnerCenter({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const PageSkeleton = {
  StatCards: StatCardsSkeleton,
  Table: TableSkeleton,
  CardsGrid: CardsGridSkeleton,
  Panel: PanelSkeleton,
  Notifications: NotificationSkeleton,
  Profile: ProfileSkeleton,
  Dashboard: DashboardSkeleton,

  Repository: RepositorySkeleton,
  Reports: ReportsSkeleton,
  Tags: TagsSkeleton,
  AreaDetail: AreaDetailSkeleton,
  MyAreas: MyAreasSkeleton,
  Archives: ArchivesSkeleton,
  PageHeader: PageHeaderSkeleton,
  Spinner: SpinnerCenter,
}
