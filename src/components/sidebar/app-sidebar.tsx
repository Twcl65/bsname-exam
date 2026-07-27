"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LifeBuoy,
  MessageSquare,
  Settings,
  UserCheck,
  BookOpen
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
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
  user: {
    name: "Super Admin",
    email: "admin@marinex.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Super Admin",
      url: "/super-admin",
      icon: Settings,
      items: [
        {
          title: "Dashboard",
          url: "/super-admin"
        },
        {
          title: "Subject Management",
          url: "/super-admin/subject-management"
        },
        {
          title: "Exam Question Bank",
          url: "/super-admin/exam-question-bank"
        },
        {
          title: "Progress Tracker",
          url: "/super-admin/progress-tracker"
        },
        {
          title: "User Management",
          url: "/super-admin/user-management"
        },
        {
          title: "Reports & Analytics",
          url: "/super-admin/reports-analytics"
        },
        {
          title: "Ranking & Leaderboards",
          url: "/super-admin/ranking-leaderboards"
        }
      ]
    },
    {
      title: "Instructor",
      url: "/instructor",
      icon: UserCheck,
      items: [
        {
          title: "Dashboard",
          url: "/instructor"
        },
        {
          title: "Exam Question Bank",
          url: "/instructor/exam-question-bank"
        },
        {
          title: "Progress Tracker",
          url: "/instructor/progress-tracker"
        },
        {
          title: "Reports & Analytics",
          url: "/instructor/reports-analytics"
        },
        {
          title: "Ranking & Leaderboards",
          url: "/instructor/ranking-leaderboards"
        }
      ]
    },
    {
      title: "Student",
      url: "/student",
      icon: BookOpen,
      items: [
        {
          title: "Dashboard",
          url: "/student"
        },
        {
          title: "Exams",
          url: "/student/exams"
        },
        {
          title: "Progress Tracker",
          url: "/student/progress-tracker"
        },
        {
          title: "Rankings & Leaderboards",
          url: "/student/rankings-leaderboards"
        },
        {
          title: "Gamification & Achievements",
          url: "/student/gamification-achievements"
        }
      ]
    }
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navMainWithActive = React.useMemo(() => {
    return data.navMain.map(item => ({
      ...item,
      isActive: item.items
        ? pathname === item.url || item.items.some(subItem => pathname === subItem.url)
        : pathname === item.url
    }))
  }, [pathname])

  const navSecondaryWithActive = React.useMemo(() => {
    return data.navSecondary.map(item => ({
      ...item,
      isActive: pathname === item.url
    }))
  }, [pathname])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-10 items-center justify-center rounded-full overflow-hidden bg-transparent">
                  <img src="/logo.png" alt="USTP Logo" className="size-10 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Board Exam System</span>
                  <span className="truncate text-xs">Learning Management System</span>
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
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}