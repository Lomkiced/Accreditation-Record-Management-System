import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarInitialsProps {
  name: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
]

function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-[120px] h-[120px] text-4xl",
}

export function AvatarInitials({ name, size = "md", className }: AvatarInitialsProps) {
  const colorIndex = getColorIndex(name)
  const colors = AVATAR_COLORS[colorIndex]
  const initials = getInitials(name)

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        "font-semibold flex-shrink-0 select-none",
        sizeMap[size],
        colors.bg,
        colors.text,
        className
      )}
    >
      {initials}
    </div>
  )
}
