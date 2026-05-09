"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  User,
  Mail,
  Building,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { toast } from "sonner"
import { updateProfile, changePassword } from "@/actions/auth.actions"
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  type UpdateProfileValues,
  type ChangePasswordValues,
} from "@/lib/validations/auth.schema"

interface ProfileFormProps {
  user: {
    name: string
    email: string
    department: string
    designation: string
    phone?: string | null
    isActive?: boolean
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)

  // ── Profile form ──────────────────────────────────────────────────────────
  const profileForm = useForm<UpdateProfileValues>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: user.name,
      department: user.department,
      designation: user.designation,
      phone: user.phone ?? "",
    },
  })

  const onProfileSubmit = async (data: UpdateProfileValues) => {
    const result = await updateProfile(data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Profile updated successfully.")
    }
  }

  // ── Password form ─────────────────────────────────────────────────────────
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const newPasswordValue = passwordForm.watch("newPassword") ?? ""
  const passStrengthPct = Math.min(100, (newPasswordValue.length / 12) * 100)
  const passColor =
    passStrengthPct < 40
      ? "bg-red-500"
      : passStrengthPct < 75
        ? "bg-amber-500"
        : "bg-emerald-500"

  const onPasswordSubmit = async (data: ChangePasswordValues) => {
    const result = await changePassword(data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Password changed successfully.")
      passwordForm.reset()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Sidebar ── */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <AvatarInitials
            name={user.name}
            size="lg"
            className="w-24 h-24 text-2xl mb-4"
          />
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {user.designation}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold mt-3 ${
              user.isActive !== false
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {user.isActive !== false ? "Active Account" : "Inactive Account"}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">
            Account Details
          </h3>
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Email Address</p>
              <p className="text-sm text-slate-700 break-all">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Department</p>
              <p className="text-sm text-slate-700">{user.department}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Forms ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Personal Information</h3>
            <p className="text-sm text-slate-500 mt-1">
              Update your personal details and contact information.
            </p>
          </div>

          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    className="pl-9"
                    {...profileForm.register("name")}
                  />
                </div>
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-red-500">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email (read-only — managed by Supabase) */}
              <div className="space-y-2">
                <Label htmlFor="email-display">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email-display"
                    value={user.email}
                    readOnly
                    disabled
                    className="pl-9 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Email cannot be changed here. Contact admin.
                </p>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="department"
                    className="pl-9"
                    {...profileForm.register("department")}
                  />
                </div>
                {profileForm.formState.errors.department && (
                  <p className="text-xs text-red-500">
                    {profileForm.formState.errors.department.message}
                  </p>
                )}
              </div>

              {/* Designation */}
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="designation"
                    className="pl-9"
                    {...profileForm.register("designation")}
                  />
                </div>
                {profileForm.formState.errors.designation && (
                  <p className="text-xs text-red-500">
                    {profileForm.formState.errors.designation.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    className="pl-9"
                    placeholder="09XXXXXXXXX"
                    {...profileForm.register("phone")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? (
                  "Saving…"
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Change Password</h3>
            <p className="text-sm text-slate-500 mt-1">
              Use a strong, unique password to keep your account secure.
            </p>
          </div>

          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="p-6 space-y-5"
          >
            <div className="max-w-md space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                    {...passwordForm.register("currentPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-400"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-red-500">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    className="pl-9 pr-10"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-400"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {/* Password strength bar */}
                {newPasswordValue.length > 0 && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passColor}`}
                      style={{ width: `${passStrengthPct}%` }}
                    />
                  </div>
                )}
                {/* Requirements checklist */}
                <ul className="space-y-1 text-xs">
                  {[
                    { label: "At least 8 characters", ok: newPasswordValue.length >= 8 },
                    { label: "One uppercase letter", ok: /[A-Z]/.test(newPasswordValue) },
                    { label: "One number", ok: /[0-9]/.test(newPasswordValue) },
                    { label: "One special character", ok: /[^A-Za-z0-9]/.test(newPasswordValue) },
                  ].map((req) => (
                    <li
                      key={req.label}
                      className={`flex items-center gap-1.5 ${req.ok ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {req.ok ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {req.label}
                    </li>
                  ))}
                </ul>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showNew ? "text" : "password"}
                    className="pl-9"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                  />
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant="outline"
                className="text-slate-700 bg-white"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting
                  ? "Updating…"
                  : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
