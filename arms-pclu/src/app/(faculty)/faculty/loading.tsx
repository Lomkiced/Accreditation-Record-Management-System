import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

export default function FacultyLoading() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-slate-200" />
          <Skeleton className="h-4 w-72 bg-slate-200" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-xl bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <div className="min-h-[400px] rounded-xl border border-slate-200 bg-white flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
        <div className="min-h-[400px] rounded-xl border border-slate-200 bg-white flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    </div>
  )
}
