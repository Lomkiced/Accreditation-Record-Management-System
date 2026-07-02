"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Shuffle, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createFacultyAccount, updateFacultyProfile } from "@/actions/auth.actions"
import {
  CreateFacultySchema,
  UpdateProfileSchema,
  type CreateFacultyValues,
} from "@/lib/validations/auth.schema"
import { type UserWithCounts } from "@/actions/user.actions"
import { useQueryClient } from "@tanstack/react-query"
import { userKeys } from "@/hooks/useUsers"

interface UserFormPanelProps {
  open: boolean
  onClose: () => void
  user?: UserWithCounts
}

export function UserFormPanel({ open, onClose, user }: UserFormPanelProps) {
  const isEdit = !!user
  const [showPassword, setShowPassword] = React.useState(false)
  const [isActive, setIsActive] = React.useState(user?.status === "ACTIVE")

  // We use CreateFacultySchema for creation, and cast it safely since we handle isEdit below
  const form = useForm<CreateFacultyValues>({
    resolver: zodResolver(isEdit ? UpdateProfileSchema : CreateFacultySchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      designation: "",
      phone: "",
      password: "",
    },
  })
  
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (open) {
      setIsActive(user?.status !== "INACTIVE")
      form.reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        department: user?.department ?? "",
        designation: user?.designation ?? "",
        phone: "",
        password: "",
      })
    }
  }, [open, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let pwd = ""
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    form.setValue("password", pwd, { shouldValidate: true })
    setShowPassword(true)
  }

  const onSubmit = async (data: CreateFacultyValues) => {
    if (isEdit && user) {
      // Update existing faculty
      const result = await updateFacultyProfile(user.id, {
        name: data.name,
        department: data.department,
        designation: data.designation,
        phone: data.phone,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Faculty profile updated for ${data.name}.`)
        queryClient.invalidateQueries({ queryKey: userKeys.all })
        onClose()
      }
    } else {
      // Create new faculty
      const result = await createFacultyAccount(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Faculty account created for ${data.name}.`)
        queryClient.invalidateQueries({ queryKey: userKeys.all })
        onClose()
      }
    }
  }

  const passwordVal = form.watch("password") ?? ""
  const passStrengthPct = Math.min(100, (passwordVal.length / 12) * 100)
  const passColor =
    passStrengthPct < 40
      ? "bg-red-500"
      : passStrengthPct < 75
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] overflow-y-auto bg-[#F8FAFC]"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-900">
            {isEdit ? "Edit Faculty Account" : "Add Faculty Account"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="fname">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input id="fname" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="femail">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input id="femail" type="email" disabled={isEdit} {...form.register("email")} />
              <p className="text-xs text-slate-500">
                {isEdit ? "Email address cannot be changed." : "This will be their login email."}
              </p>
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fdept">
                Department <span className="text-red-500">*</span>
              </Label>
              <Input id="fdept" {...form.register("department")} />
              {form.formState.errors.department && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fdesig">
                Designation <span className="text-red-500">*</span>
              </Label>
              <Input id="fdesig" {...form.register("designation")} />
              {form.formState.errors.designation && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.designation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fphone">Phone Number</Label>
              <Input
                id="fphone"
                placeholder="09XXXXXXXXX"
                {...form.register("phone")}
              />
            </div>
          </div>

          {/* Password Setup (create mode only) */}
          {!isEdit && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Password Setup
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-blue-600"
                  onClick={generatePassword}
                >
                  <Shuffle className="w-3.5 h-3.5 mr-1" />
                  Generate
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fpassword">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="fpassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Strength bar */}
                {passwordVal.length > 0 && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${passColor}`}
                      style={{ width: `${passStrengthPct}%` }}
                    />
                  </div>
                )}

                {/* Requirements */}
                <ul className="space-y-1">
                  {[
                    { label: "At least 8 characters", ok: passwordVal.length >= 8 },
                    { label: "One uppercase letter", ok: /[A-Z]/.test(passwordVal) },
                    { label: "One number", ok: /[0-9]/.test(passwordVal) },
                  ].map((r) => (
                    <li
                      key={r.label}
                      className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {r.ok ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {r.label}
                    </li>
                  ))}
                </ul>

                {form.formState.errors.password && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (isEdit ? "Updating…" : "Creating…") : (isEdit ? "Update Profile" : "Create Faculty Account")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
