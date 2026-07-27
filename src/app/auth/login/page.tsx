import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 pt-24 md:p-10 bg-slate-950">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 z-0"></div>

      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/bg-pic.jpg')] bg-cover bg-center bg-no-repeat opacity-20 z-0"></div>

      {/* Dark/Transparent Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-0"></div>

      {/* Subtle Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

      {/* Mobile Top Header (Visible only on mobile, hidden on md+) */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center px-6 md:hidden">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-transparent">
            <img src="/logo.png" alt="USTP Logo" className="size-8 object-contain" />
          </div>
          <span className="text-gray-900 font-bold text-base">BSNAME Mock Board Exam System</span>
        </Link>
      </div>

      {/* Desktop Top Header (Hidden on mobile, visible on md+) */}
      <div className="hidden md:block fixed top-6 left-8 z-50">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-transparent">
            <img src="/logo.png" alt="USTP Logo" className="size-8 object-contain" />
          </div>
          <span className="text-white font-semibold text-lg">BSNAME Mock Board Exam System</span>
        </Link>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
