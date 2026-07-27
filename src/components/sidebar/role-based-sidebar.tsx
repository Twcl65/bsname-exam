"use client"

import { useUser } from "@/contexts/UserContext"
import { SuperAdminSidebar } from "./super-admin-sidebar"
import { InstructorSidebar } from "./instructor-sidebar"
import { StudentSidebar } from "./student-sidebar"

export function RoleBasedSidebar() {
    const { user } = useUser()

    if (!user) {
        return null
    }

    switch (user.role) {
        case 'super-admin':
            return <SuperAdminSidebar />
        case 'instructor':
            return <InstructorSidebar />
        case 'student':
            return <StudentSidebar />
        default:
            return null
    }
}
