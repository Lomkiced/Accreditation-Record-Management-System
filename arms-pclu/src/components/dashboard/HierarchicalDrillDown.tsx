"use client"

import * as React from "react"
import {
  ChevronRight,
  FileText,
  Layers,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FilePen,
  TrendingUp,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getAreasWithHierarchy } from "@/actions/document.actions"
import type { AreaWithHierarchy, MappingStatus } from "@/types/document.types"
import type { MappingStatus as PrismaMappingStatus } from "@prisma/client"

// ─── Status Badge helper ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  DRAFT:        { label: "Draft",        icon: FilePen,       className: "bg-slate-100 text-slate-600 border-slate-200" },
  SUBMITTED:    { label: "Submitted",    icon: Clock,         className: "bg-blue-100 text-blue-700 border-blue-200" },
  UNDER_REVIEW: { label: "Under Review", icon: AlertCircle,   className: "bg-amber-100 text-amber-700 border-amber-200" },
  APPROVED:     { label: "Approved",     icon: CheckCircle2,  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  RETURNED:     { label: "Returned",     icon: XCircle,       className: "bg-red-100 text-red-700 border-red-200" },
}

function MappingStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
        cfg.className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  )
}

// ─── Area compliance ring ──────────────────────────────────────────────────────

function ComplianceRing({
  percent,
  size = 44,
}: {
  percent: number
  size?: number
}) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color =
    percent >= 80
      ? "#10B981"
      : percent >= 50
        ? "#3B82F6"
        : percent >= 25
          ? "#F59E0B"
          : "#EF4444"

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={color}
      >
        {percent}%
      </text>
    </svg>
  )
}

// ─── Compute area compliance ──────────────────────────────────────────────────

function computeAreaCompliance(area: AreaWithHierarchy) {
  const allMappings = area.criteria.flatMap((c) =>
    c.indicators.flatMap((i) => i.mappings)
  )
  const totalIndicators = area.criteria.flatMap((c) => c.indicators).length
  const approvedMappingsPerIndicator = area.criteria.flatMap((c) =>
    c.indicators.filter((i) =>
      i.mappings.some((m) => m.status === "APPROVED")
    )
  )
  const approvedCount = approvedMappingsPerIndicator.length
  const submittedCount = area.criteria
    .flatMap((c) => c.indicators)
    .filter((i) =>
      i.mappings.some(
        (m) => m.status === "SUBMITTED" || m.status === "UNDER_REVIEW"
      )
    ).length
  const totalDocuments = new Set(allMappings.map((m) => m.document.id)).size
  const compliancePercent =
    totalIndicators > 0
      ? Math.round((approvedCount / totalIndicators) * 100)
      : 0

  return { totalIndicators, approvedCount, submittedCount, totalDocuments, compliancePercent }
}

// ─── Indicator Row ─────────────────────────────────────────────────────────────

function IndicatorRow({
  indicator,
}: {
  indicator: AreaWithHierarchy["criteria"][number]["indicators"][number]
}) {
  const [expanded, setExpanded] = React.useState(false)
  const mappingCount = indicator.mappings.length
  const approvedCount = indicator.mappings.filter(
    (m) => m.status === "APPROVED"
  ).length

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
      {/* Indicator header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 leading-snug">
            {indicator.name}
          </p>
          {indicator.requiredDocs && (
            <p className="text-xs text-slate-400 mt-0.5 leading-tight truncate">
              Required: {indicator.requiredDocs}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mappingCount === 0 ? (
            <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
              No documents
            </span>
          ) : (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                approvedCount === mappingCount
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
              )}
            >
              {mappingCount} doc{mappingCount > 1 ? "s" : ""}
            </span>
          )}
          <ChevronRight
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Document mappings list */}
      {expanded && mappingCount > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 divide-y divide-slate-100">
          {indicator.mappings.map((mapping) => (
            <div
              key={mapping.id}
              className="flex items-start gap-3 px-4 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {mapping.document.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mapping.document.user.name} ·{" "}
                  {new Date(mapping.document.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </p>
              </div>
              <div className="shrink-0 mt-0.5">
                <MappingStatusBadge status={mapping.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty placeholder */}
      {expanded && mappingCount === 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-400 italic">
            No documents have been mapped to this indicator yet.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AREA_ACCENT_COLORS = [
  { bg: "bg-blue-500",   light: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
  { bg: "bg-violet-500", light: "bg-violet-50",  border: "border-violet-200", text: "text-violet-700" },
  { bg: "bg-emerald-500",light: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-700"},
  { bg: "bg-amber-500",  light: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700"  },
  { bg: "bg-rose-500",   light: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700"   },
  { bg: "bg-cyan-500",   light: "bg-cyan-50",    border: "border-cyan-200",   text: "text-cyan-700"   },
  { bg: "bg-orange-500", light: "bg-orange-50",  border: "border-orange-200", text: "text-orange-700" },
  { bg: "bg-teal-500",   light: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-700"   },
]

export function HierarchicalDrillDown() {
  const [areas, setAreas] = React.useState<AreaWithHierarchy[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getAreasWithHierarchy()
      if (result.success && result.data) {
        setAreas(result.data)
      } else {
        setError(result.error ?? "Failed to load hierarchy.")
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
        <span className="text-sm text-slate-500">Loading accreditation hierarchy...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-800">
            Accreditation Evidence Hierarchy
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Click an area to explore</span>
        </div>
      </div>

      {/* Area accordion */}
      <Accordion type="multiple" className="divide-y divide-slate-100">
        {areas.map((area, aIdx) => {
          const accent = AREA_ACCENT_COLORS[aIdx % AREA_ACCENT_COLORS.length]
          const stats = computeAreaCompliance(area)

          return (
            <AccordionItem
              key={area.id}
              value={area.id}
              className="border-0"
            >
              {/* ── Level 1: Area ── */}
              <AccordionTrigger
                className={cn(
                  "px-5 py-4 hover:no-underline group",
                  "[&[data-state=open]]:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-4 w-full text-left">
                  {/* Area number badge */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm",
                      accent.bg
                    )}
                  >
                    {aIdx + 1}
                  </div>

                  {/* Area name and stats */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {area.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">
                        {area.criteria.length} criteria ·{" "}
                        {stats.totalIndicators} indicators
                      </span>
                      {stats.totalDocuments > 0 && (
                        <span className="text-xs text-slate-400">
                          · {stats.totalDocuments} document
                          {stats.totalDocuments !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compliance metrics */}
                  <div className="flex items-center gap-3 shrink-0 mr-2">
                    <div className="hidden sm:flex items-center gap-3 text-right">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                          Approved
                        </p>
                        <p className={cn("text-sm font-bold", accent.text)}>
                          {stats.approvedCount}/{stats.totalIndicators}
                        </p>
                      </div>
                    </div>
                    <ComplianceRing percent={stats.compliancePercent} />
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-0 pb-0">
                {/* ── Level 2: Criteria ── */}
                <div className={cn("border-t border-slate-100", accent.light, "px-5 py-4 space-y-4")}>
                  {area.criteria.map((criterion) => {
                    const critDocCount = criterion.indicators.reduce(
                      (acc, i) => acc + i.mappings.length,
                      0
                    )
                    const critApprovedCount = criterion.indicators.filter(
                      (i) => i.mappings.some((m) => m.status === "APPROVED")
                    ).length

                    return (
                      <div key={criterion.id}>
                        {/* Criterion header */}
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={cn(
                              "h-px flex-1",
                              accent.border,
                              "border-t"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 shrink-0",
                              accent.text
                            )}
                          >
                            Criterion
                          </span>
                          <div
                            className={cn(
                              "h-px flex-1",
                              accent.border,
                              "border-t"
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "rounded-xl border p-3 mb-3",
                            accent.border,
                            "bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800 leading-snug">
                              {criterion.name}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {critDocCount > 0 && (
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                    accent.border,
                                    accent.text,
                                    accent.light
                                  )}
                                >
                                  {critDocCount} doc{critDocCount > 1 ? "s" : ""}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {critApprovedCount}/{criterion.indicators.length} approved
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── Level 3: Indicators ── */}
                        <div className="ml-3 space-y-1.5">
                          {criterion.indicators.map((indicator) => (
                            <IndicatorRow
                              key={indicator.id}
                              indicator={indicator}
                            />
                          ))}
                          {criterion.indicators.length === 0 && (
                            <p className="text-xs text-slate-400 italic px-2">
                              No indicators defined for this criterion.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {area.criteria.length === 0 && (
                    <p className="text-sm text-slate-400 text-center italic py-4">
                      No criteria defined for this area.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {areas.length === 0 && (
        <div className="px-5 py-12 text-center">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            No accreditation areas have been set up yet.
          </p>
        </div>
      )}
    </div>
  )
}
