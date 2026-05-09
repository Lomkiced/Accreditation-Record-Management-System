import { z } from "zod"

// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
})

// ─── Create Faculty ───────────────────────────────────────────────────────────
export const CreateFacultySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
})

// ─── Update Profile ───────────────────────────────────────────────────────────
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
})

// ─── Change Password ──────────────────────────────────────────────────────────
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// ─── Reset Password (Admin) ───────────────────────────────────────────────────
export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// ─── Exported Types ───────────────────────────────────────────────────────────
export type LoginValues = z.infer<typeof LoginSchema>
export type CreateFacultyValues = z.infer<typeof CreateFacultySchema>
export type UpdateProfileValues = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>
export type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>
