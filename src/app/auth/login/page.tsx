import { Anchor } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-slate-950">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 z-0"></div>
      
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/bg-pic.jpg')] bg-cover bg-center bg-no-repeat opacity-20 z-0"></div>
      
      {/* Dark/Transparent Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-0"></div>

      {/* Subtle Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="fixed top-6 left-8 z-50">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Anchor className="size-4" />
            </div>
            <span className="hidden sm:inline text-white font-semibold">BSNAME-ExamSys</span>
          </a>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
