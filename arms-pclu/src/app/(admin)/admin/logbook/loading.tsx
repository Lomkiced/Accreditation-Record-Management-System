import { PageSkeleton } from "@/components/shared/PageSkeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageSkeleton.PageHeader />
      <PageSkeleton.Logbook rows={8} />
    </div>
  )
}