import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-slate-200" />
          <Skeleton className="h-4 w-96 bg-slate-200" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24 bg-slate-200" />
          <Skeleton className="h-10 w-32 bg-slate-200" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
      </div>

      <div className="flex-1 min-h-[400px] rounded-xl border border-slate-200 bg-white p-8 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading workspace...</p>
        </div>
      </div>
    </div>
  )
}
