"use client"

import { useUser } from "@/contexts/UserContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Dashboard() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        // Redirect based on user role
        switch (user.role) {
          case 'super-admin':
            router.push('/super-admin')
            break
          case 'instructor':
            router.push('/instructor')
            break
          case 'student':
            router.push('/student')
            break
          default:
            router.push('/auth/login')
        }
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return null
}
