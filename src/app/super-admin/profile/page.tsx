"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SuperAdminProfileRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/profile')
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    )
}
