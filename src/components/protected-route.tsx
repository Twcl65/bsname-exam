"use client"

import { useUser } from "@/contexts/UserContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: string[]
    redirectTo?: string
}

export function ProtectedRoute({
    children,
    allowedRoles = [],
    redirectTo = "/auth/login"
}: ProtectedRouteProps) {
    const { user, isLoading } = useUser()
    const router = useRouter()
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

    useEffect(() => {
        if (!isLoading) {
            setHasInitiallyLoaded(true)

            if (!user) {
                router.push(redirectTo)
                return
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                // Redirect to appropriate dashboard based on user role
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
                return
            }
        }
    }, [user, isLoading, allowedRoles, redirectTo, router])

    // Only show loading spinner on initial load, not on subsequent navigations
    if (isLoading && !hasInitiallyLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return null
    }

    return <>{children}</>
}
