import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagBadgeProps {
  name: string
  color: string
  size?: "sm" | "md"
  removable?: boolean
  onRemove?: () => void
}

export function TagBadge({ name, color, size = "md", removable, onRemove }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {name}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors"
        >
          <X className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </button>
      )}
    </span>
  )
}
