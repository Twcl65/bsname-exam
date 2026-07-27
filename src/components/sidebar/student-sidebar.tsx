"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  FileText,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { useUser } from "@/contexts/UserContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/student",
      icon: Home
    },
    {
      title: "Exams",
      url: "/student/exams",
      icon: FileText
    },
  ],
  navSecondary: [] as { title: string; url: string; icon: LucideIcon }[]
}

export function StudentSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useUser()

  const navMainWithActive = React.useMemo(() => {
    return data.navMain.map(item => ({
      ...item,
      isActive: pathname === item.url
    }))
  }, [pathname])

  const navSecondaryWithActive = React.useMemo(() => {
    return data.navSecondary.length > 0 ? data.navSecondary.map(item => ({
      ...item,
      isActive: pathname === item.url
    })) : []
  }, [pathname])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent hover:text-inherit">
              <a href="#">
                <div className="flex aspect-square size-10 items-center justify-center rounded-full overflow-hidden bg-transparent">
                  <img src="/logo.png" alt="USTP Logo" className="size-10 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Mock Board Exam System</span>
                  <span className="truncate text-xs">Student Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainWithActive} />
        <NavSecondary items={navSecondaryWithActive} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user || { name: "Student", email: "student@marinex.com", avatar: "/avatars/student.jpg" }} />
      </SidebarFooter>
    </Sidebar>
  )
}
