import * as React from "react"
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm"

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      {/* Decorative background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse duration-10000" />
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20" />
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-violet-600 rounded-full mix-blend-screen filter blur-[140px] opacity-20" />
      
      {/* Left panel — Hero text */}
      <div className="hidden lg:flex w-[55%] flex-col p-12 relative z-10 justify-between">
        <div>
          {/* Logo space */}
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl animate-in slide-in-from-left-8 fade-in duration-1000">
          <h1 className="text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight">
            Accreditation Record
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Management System
            </span>
          </h1>
          <p className="text-slate-400 mt-6 text-lg max-w-lg font-light leading-relaxed">
            for IT Department in Polytechnic College of La Union.
          </p>
        </div>

        <div className="animate-in fade-in duration-1000 delay-500">
          <p className="text-sm text-slate-600 font-medium">
            © {new Date().getFullYear()} Polytechnic College of La Union. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4 lg:p-0">
        <div className="w-full max-w-[440px] bg-slate-900/60 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none border border-white/10 lg:border-none rounded-3xl p-6 lg:p-0 shadow-2xl lg:shadow-none animate-in fade-in zoom-in-95 duration-700">
          <div className="lg:bg-white lg:p-12 lg:rounded-[2.5rem] lg:shadow-2xl border border-slate-100/50">
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
