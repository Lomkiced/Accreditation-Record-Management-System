import { PageSkeleton } from "@/components/shared/PageSkeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageSkeleton.PageHeader hasAction={false} />
      <PageSkeleton.Dashboard statCount={4} />
    </div>
  )
}