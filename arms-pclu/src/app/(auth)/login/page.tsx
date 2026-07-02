import * as React from "react"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      {/* Decorative background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse duration-10000" />
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20" />
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-violet-600 rounded-full mix-blend-screen filter blur-[140px] opacity-20" />
      
      {/* Left panel — Hero text */}
      <div className="hidden lg:flex w-[55%] flex-col p-12 relative z-10 justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center shadow-2xl">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg shadow-inner" />
            </div>
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">
              ARMS
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl animate-in slide-in-from-left-8 fade-in duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium w-fit mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online & Secure
          </div>
          <h1 className="text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight">
            Accreditation Record
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Management System
            </span>
          </h1>
          <p className="text-slate-400 mt-6 text-lg max-w-lg font-light leading-relaxed">
            Elevating academic standards for the Polytechnic College of La Union through centralized, secure, and intelligent compliance tracking.
          </p>

          <div className="mt-12 flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 max-w-md backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5 cursor-default">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 text-xl border border-blue-500/20 shadow-inner">
                📁
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">Centralized Vault</span>
                <span className="text-xs text-slate-500 mt-0.5">Secure, organized evidence repository</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 max-w-md backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5 cursor-default">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 text-xl border border-indigo-500/20 shadow-inner">
                🏷️
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">PACUCOA Intelligence</span>
                <span className="text-xs text-slate-500 mt-0.5">Streamlined area management mapping</span>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in duration-1000 delay-500">
          <p className="text-sm text-slate-600 font-medium">
            © {new Date().getFullYear()} Polytechnic College of La Union. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4 lg:p-0">
        {/* The glass card for mobile, solid white for desktop */}
        <div className="w-full max-w-[440px] bg-slate-900/60 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none border border-white/10 lg:border-none rounded-3xl p-6 lg:p-0 shadow-2xl lg:shadow-none animate-in fade-in zoom-in-95 duration-700">
          <div className="lg:bg-white lg:p-12 lg:rounded-[2.5rem] lg:shadow-2xl border border-slate-100/50">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
