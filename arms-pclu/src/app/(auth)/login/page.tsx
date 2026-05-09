import * as React from "react"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-[#0F172A] flex-col p-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-navy rounded-sm" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">ARMS</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Accreditation Record
          </h1>
          <h1 className="text-3xl font-bold text-blue-400 leading-tight">
            Management System
          </h1>
          <p className="text-slate-400 mt-3 text-sm max-w-md">
            Polytechnic College of La Union
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <div className="bg-white/10 rounded-full px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
              📁 Centralized Document Storage
            </div>
            <div className="bg-white/10 rounded-full px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
              🏷️ PAASCU Area Management
            </div>
            <div className="bg-white/10 rounded-full px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
              📊 Compliance Tracking
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            © 2025 Polytechnic College of La Union
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <React.Suspense fallback={null}>
            <LoginForm />
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
