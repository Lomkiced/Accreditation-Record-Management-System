import * as React from "react"
import { AvatarInitials } from "../shared/AvatarInitials"
import { cn } from "@/lib/utils"

const mockActivities = [
  { id: 1, userName: "Dr. Juan Perez", action: "submitted evidence for Area 2", timeAgo: "10 mins ago", type: "submit" },
  { id: 2, userName: "Maria Clara", action: "acknowledged logbook entry #1023", timeAgo: "1 hour ago", type: "logbook" },
  { id: 3, userName: "Admin User", action: "approved document 'Syllabus 2024'", timeAgo: "2 hours ago", type: "approve" },
  { id: 4, userName: "Prof. Dela Cruz", action: "updated Indicator 3.2", timeAgo: "5 hours ago", type: "edit" },
  { id: 5, userName: "System", action: "generated Compliance Report", timeAgo: "1 day ago", type: "system" },
]

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <h3 className="text-base font-semibold text-slate-800 flex-shrink-0">
        Recent Activity
      </h3>

      <div className="mt-4 flex-1 overflow-y-auto max-h-[260px] space-y-1 -mr-2 pr-2">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0"
          >
            <AvatarInitials
              name={activity.userName}
              size="sm"
              className="flex-shrink-0 mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-snug">
                <span className="font-semibold">{activity.userName}</span>{" "}
                {activity.action}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{activity.timeAgo}</p>
            </div>

            <span
              className={cn(
                "w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                activity.type === "submit" && "bg-blue-500",
                activity.type === "approve" && "bg-emerald-500",
                activity.type === "logbook" && "bg-violet-500",
                activity.type === "edit" && "bg-amber-500",
                activity.type === "system" && "bg-slate-400"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
