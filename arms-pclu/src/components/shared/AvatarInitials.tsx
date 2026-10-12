"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type UserRoleType = "ADMIN" | "DEAN" | "FACULTY" | string

export interface AvatarInitialsProps {
  /** User's display name or email. Used for accessibility title */
  name?: string
  /** Role determining the professional avatar archetype */
  role?: UserRoleType
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  /** Optional custom class overrides */
  className?: string
  /** Optional custom image URL if user uploaded one */
  src?: string | null
  /** Optional active/selected state */
  showGlow?: boolean
}

const sizeMap = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  "2xl": "w-24 h-24",
}

const iconSizeMap = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-12 h-12",
}

function resolveRole(role?: string, name?: string): "ADMIN" | "DEAN" | "FACULTY" | "USER" {
  const normRole = role?.trim().toUpperCase()
  if (normRole === "ADMIN") return "ADMIN"
  if (normRole === "DEAN") return "DEAN"
  if (normRole === "FACULTY") return "FACULTY"

  if (name) {
    const lower = name.toLowerCase()
    if (lower.includes("admin")) return "ADMIN"
    if (lower.includes("dean")) return "DEAN"
    if (
      lower.includes("faculty") ||
      lower.includes("prof") ||
      lower.includes("instructor") ||
      lower.includes("teacher")
    ) {
      return "FACULTY"
    }
  }

  return "USER"
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. Admin: Clean Enterprise Administrator Shield
 * ──────────────────────────────────────────────────────────────────────────── */
function AdminRoleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. Dean: Clean Academic Executive Mortarboard Cap
 * ──────────────────────────────────────────────────────────────────────────── */
function DeanRoleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. Faculty: Clean Academic Educator / Scholar Codex
 * ──────────────────────────────────────────────────────────────────────────── */
function FacultyRoleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 4. General User Silhouette (Fallback)
 * ──────────────────────────────────────────────────────────────────────────── */
function DefaultUserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component: RoleAvatar / AvatarInitials
 * ──────────────────────────────────────────────────────────────────────────── */
export function AvatarInitials({
  name = "User",
  role,
  size = "md",
  className,
  src,
  showGlow = false,
}: AvatarInitialsProps) {
  const resolvedRole = resolveRole(role, name)

  // Unified, high-end enterprise styling: understated neutral base with subtle corporate role accents
  const roleStyles = {
    ADMIN: {
      bg: "bg-slate-900 border-slate-700/80 text-blue-400",
      accentRing: showGlow ? "ring-2 ring-blue-500/30" : "ring-1 ring-slate-700/40",
      title: `${name} (System Administrator)`,
    },
    DEAN: {
      bg: "bg-slate-900 border-slate-700/80 text-sky-400",
      accentRing: showGlow ? "ring-2 ring-sky-500/30" : "ring-1 ring-slate-700/40",
      title: `${name} (Program Dean)`,
    },
    FACULTY: {
      bg: "bg-slate-900 border-slate-700/80 text-emerald-400",
      accentRing: showGlow ? "ring-2 ring-emerald-500/30" : "ring-1 ring-slate-700/40",
      title: `${name} (Academic Faculty)`,
    },
    USER: {
      bg: "bg-slate-900 border-slate-700/80 text-slate-300",
      accentRing: "ring-1 ring-slate-700/40",
      title: name,
    },
  }[resolvedRole]

  const iconClasses = iconSizeMap[size]

  return (
    <div
      title={roleStyles.title}
      className={cn(
        "relative rounded-full flex items-center justify-center flex-shrink-0 select-none overflow-hidden",
        "border shadow-xs transition-colors duration-150",
        sizeMap[size],
        roleStyles.bg,
        roleStyles.accentRing,
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover rounded-full"
        />
      ) : resolvedRole === "ADMIN" ? (
        <AdminRoleIcon className={iconClasses} />
      ) : resolvedRole === "DEAN" ? (
        <DeanRoleIcon className={iconClasses} />
      ) : resolvedRole === "FACULTY" ? (
        <FacultyRoleIcon className={iconClasses} />
      ) : (
        <DefaultUserIcon className={iconClasses} />
      )}
    </div>
  )
}

/** Modern semantic alias for AvatarInitials */
export const RoleAvatar = AvatarInitials
