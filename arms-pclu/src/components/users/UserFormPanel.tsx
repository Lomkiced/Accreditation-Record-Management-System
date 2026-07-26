"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Shuffle, Eye, EyeOff, CheckCircle, XCircle, KeyRound } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFacultyAccount, updateFacultyProfile, resetFacultyPassword } from "@/actions/auth.actions"
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
  allowedRoles?: Array<"ADMIN" | "DEAN" | "FACULTY">
}

export function UserFormPanel({ open, onClose, user, allowedRoles = ["ADMIN", "DEAN", "FACULTY"] }: UserFormPanelProps) {
  const isEdit = !!user
  const [showPassword, setShowPassword] = React.useState(false)
  const defaultRole = allowedRoles.length === 1 ? allowedRoles[0] : "FACULTY"
  const [selectedRole, setSelectedRole] = React.useState<"ADMIN" | "DEAN" | "FACULTY">(user?.role ?? defaultRole)
  
  // Password Reset State
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [isSubmittingReset, setIsSubmittingReset] = React.useState(false)

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
      setIsResettingPassword(false)
      setNewPassword("")
      if (user) {
        setSelectedRole(user.role)
        form.reset({
          name: user.name ?? "",
          email: user.email ?? "",
          department: user.department ?? "",
          designation: user.designation ?? "",
          phone: "",
          password: "",
        })
      } else {
        setSelectedRole(defaultRole)
        form.reset({
          name: "",
          email: "",
          department: "",
          designation: "",
          phone: "",
          password: "",
        })
      }
    }
  }, [open, user, form, defaultRole])

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let pwd = ""
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    if (isEdit && isResettingPassword) {
      setNewPassword(pwd)
    } else {
      form.setValue("password", pwd, { shouldValidate: true })
    }
    setShowPassword(true)
  }

  const handleResetPassword = async () => {
    if (!user || !newPassword) return
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    setIsSubmittingReset(true)
    const result = await resetFacultyPassword(user.id, newPassword)
    setIsSubmittingReset(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Password reset successfully.")
      setIsResettingPassword(false)
      setNewPassword("")
    }
  }

  const onSubmit = async (data: CreateFacultyValues) => {
    try {
      if (isEdit && user) {
        const result = await updateFacultyProfile(user.id, {
          name: data.name,
          department: data.department,
          designation: data.designation,
          phone: data.phone,
        })
        if (!result) return toast.error("Network error.")
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Profile updated.")
          queryClient.invalidateQueries({ queryKey: userKeys.all() })
          onClose()
        }
      } else {
        const result = await createFacultyAccount(data, selectedRole)
        if (!result) return toast.error("Network error.")
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`${selectedRole} account created.`)
          queryClient.invalidateQueries({ queryKey: userKeys.all() })
          onClose()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred."
      toast.error(message)
    }
  }

  const passwordVal = isEdit && isResettingPassword ? newPassword : (form.watch("password") ?? "")
  const passStrengthPct = Math.min(100, (passwordVal.length / 12) * 100)
  const passColor = passStrengthPct < 40 ? "bg-red-500" : passStrengthPct < 75 ? "bg-amber-500" : "bg-emerald-500"

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto bg-[#F8FAFC]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-900">
            {isEdit ? "Edit Account" : "Add New Account"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Basic Information
            </h3>

            {!isEdit && (
              <div className="space-y-2">
                <Label>Role <span className="text-red-500">*</span></Label>
                <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)} disabled={allowedRoles.length === 1}>
                  <SelectTrigger className="w-full bg-white border-slate-200 disabled:opacity-75 disabled:bg-slate-50">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg border-slate-200">
                    {allowedRoles.includes("ADMIN") && <SelectItem value="ADMIN">Administrator</SelectItem>}
                    {allowedRoles.includes("DEAN") && <SelectItem value="DEAN">Dean</SelectItem>}
                    {allowedRoles.includes("FACULTY") && <SelectItem value="FACULTY">Faculty</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fname">Full Name <span className="text-red-500">*</span></Label>
              <Input id="fname" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="femail">Email Address <span className="text-red-500">*</span></Label>
              <Input id="femail" type="email" disabled={isEdit} {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fdept">Department <span className="text-red-500">*</span></Label>
              <Input id="fdept" {...form.register("department")} />
              {form.formState.errors.department && (
                <p className="text-xs text-red-500">{form.formState.errors.department.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fdesig">Designation <span className="text-red-500">*</span></Label>
              <Input id="fdesig" {...form.register("designation")} />
              {form.formState.errors.designation && (
                <p className="text-xs text-red-500">{form.formState.errors.designation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fphone">Phone Number</Label>
              <Input id="fphone" placeholder="09XXXXXXXXX" {...form.register("phone")} />
            </div>
          </div>

          {/* Password Setup for New Users */}
          {!isEdit && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Password Setup
                </h3>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={generatePassword}>
                  <Shuffle className="w-3.5 h-3.5 mr-1" /> Generate
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fpassword">Password <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="fpassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...form.register("password")}
                  />
                  <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordVal.length > 0 && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${passColor}`} style={{ width: `${passStrengthPct}%` }} />
                  </div>
                )}
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Password Reset for Existing Users */}
          {isEdit && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Security
                </h3>
              </div>
              
              {!isResettingPassword ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  onClick={() => setIsResettingPassword(true)}
                >
                  <KeyRound className="w-4 h-4" />
                  Reset User Password
                </Button>
              ) : (
                <div className="space-y-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-amber-900 font-semibold">New Password</Label>
                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-amber-700" onClick={generatePassword}>
                      <Shuffle className="w-3 h-3 mr-1" /> Auto
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-amber-300 focus-visible:ring-amber-500 bg-white pr-10"
                      placeholder="Enter new password"
                    />
                    <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordVal.length > 0 && (
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${passColor}`} style={{ width: `${passStrengthPct}%` }} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      type="button" 
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-sm" 
                      onClick={handleResetPassword}
                      disabled={isSubmittingReset || newPassword.length < 8}
                    >
                      {isSubmittingReset ? "Saving..." : "Save Password"}
                    </Button>
                    <Button type="button" variant="ghost" className="flex-1 text-slate-600 hover:bg-amber-100" onClick={() => setIsResettingPassword(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : (isEdit ? "Update Profile" : `Create Account`)}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
