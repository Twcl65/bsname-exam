"use client"

import { RoleBasedSidebar } from "@/components/sidebar/role-based-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { useUser } from "@/contexts/UserContext"
import { 
  Users, 
  BookOpen, 
  TrendingUp,
  BarChart3,
} from "lucide-react"
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts"

interface DashboardStats {
  totalUsers: number
  totalSubjects: number
  totalQuestions: number
  averageScore: number
}

interface SubjectStats {
  subject_name: string
  attempts: number
  average_score: number
}

interface OnlineUser {
  id: string
  name: string
  role: string
  lastSeen: string
  status: 'online' | 'offline'
  avatar: string | null
}

export default function SuperAdminDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSubjects: 0,
    totalQuestions: 0,
    averageScore: 0
  })
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true)
        }
        
        // Fetch users data
        const usersResponse = await fetch('/api/users')
        const usersData = await usersResponse.json()
        const totalUsers = usersData.success ? usersData.data.length : 0

        // Fetch subjects data
        const subjectsResponse = await fetch('/api/subjects')
        const subjectsData = await subjectsResponse.json()
        const totalSubjects = subjectsData.success ? subjectsData.data.length : 0

        // Fetch exam history to calculate stats
        const examHistoryResponse = await fetch('/api/exam-history?all=true')
        const examHistoryData = await examHistoryResponse.json()
        
        // Fetch questions data
        const questionsResponse = await fetch('/api/questions')
        const questionsData = await questionsResponse.json()
        const totalQuestions = questionsData.success ? questionsData.data.length : 0
        
        let averageScore = 0
        
        if (examHistoryData.success && examHistoryData.data.length > 0) {
          const totalScore = examHistoryData.data.reduce((sum: number, exam: { score_percentage: number; total_questions: number; correct_answers: number }) => {
            // Calculate percentage from correct_answers and total_questions
            const percentage = exam.total_questions > 0 
              ? (exam.correct_answers / exam.total_questions) * 100 
              : 0
            return sum + percentage
          }, 0)
          averageScore = Math.round(totalScore / examHistoryData.data.length)
        }

        // Calculate subject statistics - use attempt field from exam history
        const subjectMap = new Map<string, { attempts: number, totalScore: number }>()
        
        if (examHistoryData.success && examHistoryData.data.length > 0) {
          console.log('Processing exam history data:', examHistoryData.data.length, 'exams')
          console.log('Sample exam data:', examHistoryData.data[0]) // Log first exam to see structure
          
          examHistoryData.data.forEach((exam: { subject_name: string; score_percentage: number; created_at: string; total_questions: number; correct_answers: number }) => {
            const subjectName = exam.subject_name || 'Unknown Subject'
            const existing = subjectMap.get(subjectName) || { attempts: 0, totalScore: 0 }
            
            // Each exam record represents one attempt (no separate attempt field in database)
            const attemptCount = 1
            
            // Calculate percentage from correct_answers and total_questions
            const percentage = exam.total_questions > 0 
              ? (exam.correct_answers / exam.total_questions) * 100 
              : 0
            
            subjectMap.set(subjectName, {
              attempts: existing.attempts + attemptCount, // Count each exam as one attempt
              totalScore: existing.totalScore + percentage
            })
          })
          
          console.log('Subject attempts map:', Object.fromEntries(subjectMap))
        }

        const subjectStatsArray: SubjectStats[] = Array.from(subjectMap.entries())
          .map(([subject_name, data]) => ({
            subject_name,
            attempts: data.attempts, // This is the count of exam attempts for this subject
            average_score: Math.round(data.totalScore / data.attempts)
          }))
          .sort((a, b) => b.attempts - a.attempts) // Sort by number of attempts (most attempted first)
          .slice(0, 6) // Top 6 most attempted subjects
          
        console.log('Final subject stats:', subjectStatsArray)
        console.log('Subject stats length:', subjectStatsArray.length)
        console.log('Rendering chart with subjectStats:', subjectStatsArray)

        setStats({
          totalUsers,
          totalSubjects,
          totalQuestions,
          averageScore
        })

        setSubjectStats(subjectStatsArray)

        // Generate online users from users data (only students)
        const onlineUsersData: OnlineUser[] = usersData.success 
          ? usersData.data
              .filter((user: { role: string }) => user.role === 'Student') // Only show students
              .map((user: { id: string; fullName?: string; username?: string; role: string; lastSeen?: string; profilePicture?: string }) => {
                const lastSeenTime = user.lastSeen ? new Date(user.lastSeen) : null
                const now = new Date()
                // Check if last seen is within 2 minutes (120,000 ms)
                const isOnline = lastSeenTime ? (now.getTime() - lastSeenTime.getTime() < 120000) : false
                
                return {
                  id: user.id,
                  name: user.fullName || user.username || 'Unknown Student',
                  role: user.role || 'Student',
                  lastSeen: lastSeenTime && user.lastSeen ? formatTimeAgo(user.lastSeen) : 'Never',
                  status: (isOnline ? 'online' : 'offline') as 'online' | 'offline',
                  avatar: user.profilePicture || null,
                  lastSeenEpoch: lastSeenTime ? lastSeenTime.getTime() : 0,
                  isOnline: isOnline
                }
              })
              .sort((a: { isOnline: boolean; lastSeenEpoch: number }, b: { isOnline: boolean; lastSeenEpoch: number }) => {
                // Online users first
                if (a.isOnline && !b.isOnline) return -1
                if (!a.isOnline && b.isOnline) return 1
                // Then sort by last seen epoch descending
                return b.lastSeenEpoch - a.lastSeenEpoch
              })
              .slice(0, 8) // Show top 8 students
          : []

        setOnlineUsers(onlineUsersData)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set fallback data on error
        setStats({
          totalUsers: 0,
          totalSubjects: 0,
          totalQuestions: 0,
          averageScore: 0
        })
        setSubjectStats([])
        setOnlineUsers([])
      } finally {
        if (isInitial) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData(true)
    const intervalId = setInterval(() => fetchDashboardData(false), 15000) // Poll every 15 seconds for real-time accuracy

    return () => clearInterval(intervalId)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 0) return 'Just now'
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400'
  }

  // Skeleton Loading Component
  const DashboardSkeleton = () => (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
      {/* Welcome Section Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-0 px-0 py-0">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex flex-col justify-center h-full space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-0 py-0">
        {/* Subject Analytics Skeleton */}
        <Card className="h-80 flex flex-col shadow-xs border border-gray-200 bg-white rounded-md p-0 overflow-hidden">
          <div className="px-4 pt-3 pb-0 mb-0">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <CardContent className="flex-1 p-4 pt-2 mt-0 m-0 min-h-0 flex flex-col justify-start">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-0 m-0">
                <Skeleton className="w-full h-[195px] rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Students Skeleton */}
        <Card className="h-80 flex flex-col shadow-xs border border-gray-200 bg-white rounded-md p-0 overflow-hidden">
          <div className="px-4 pt-3 pb-0">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <CardContent className="flex-1 p-4 pt-0 mt-0 m-0 min-h-0 flex flex-col justify-start">
            <div className="flex flex-col gap-3 pt-0 mt-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 text-sm bg-gray-50">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <SidebarProvider>
        <RoleBasedSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-6">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Instructor Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          {loading ? (
            <DashboardSkeleton />
          ) : (
          <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
            {/* Welcome Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                     src={user?.avatar ? (user.avatar.startsWith('http://') || user.avatar.startsWith('https://') || user.avatar.startsWith('/')) ? user.avatar : `/api/images/uploaded/${user.avatar}` : undefined} 
                     alt={user?.name || 'Admin'} 
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-bold text-gray-900">Welcome back, {user?.name || 'Admin'}!</div>
                  <div className="text-sm text-gray-500">Here&apos;s your system overview and analytics</div>
                </div>
            </div>

             {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-0 px-0 py-0">
              <div>
                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-500 rounded-lg shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-xs text-muted-foreground font-medium">Total Users</span>
                    <span className="text-base font-bold text-gray-900">{stats.totalUsers}</span>
                  </div>
                </Card>
              </div>
              <div>
                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-lg shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-xs text-muted-foreground font-medium">Total Subjects</span>
                    <span className="text-base font-bold text-gray-900">{stats.totalSubjects}</span>
                  </div>
                </Card>
              </div>
              <div>
                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-black rounded-lg shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-xs text-muted-foreground font-medium">Total Questions</span>
                    <span className="text-base font-bold text-gray-900">{stats.totalQuestions}</span>
                  </div>
                </Card>
              </div>
              <div>
                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-yellow-500 rounded-lg shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-xs text-muted-foreground font-medium">Average Score</span>
                    <span className="text-base font-bold text-gray-900">{stats.averageScore}%</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Bottom Section - Subject Analytics and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-0 py-0">
              {/* Subject Analytics */}
              <Card className="h-80 flex flex-col shadow-xs border border-gray-200 bg-white rounded-md p-0 overflow-hidden">
                <div className="px-4 pt-3 pb-0 mb-0">
                  <div className="text-base font-semibold p-0 m-0">Subject Analytics</div>
                  <div className="text-sm text-muted-foreground p-0 m-0 mt-0 mb-0">Most attempted subjects by exam count</div>
                </div>
                <CardContent className="flex-1 p-4 pt-2 mt-0 m-0 min-h-0 flex flex-col justify-start overflow-y-auto">
                  {subjectStats.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-0 m-0">
                        <ResponsiveContainer width="100%" height={195}>
                          <BarChart
                            data={subjectStats}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                          <CartesianGrid 
                            vertical={false} 
                            stroke="#e2e8f0" 
                            strokeDasharray="3 3"
                            strokeWidth={1}
                          />
                          <XAxis
                            hide
                          />
                          <YAxis hide />
                          <Tooltip 
                            formatter={(value) => [
                              value, 
                              'Exam Attempts'
                            ]}
                            labelFormatter={(label, payload) => {
                              if (payload && payload.length > 0) {
                                return `Subject: ${payload[0].payload.subject_name}`
                              }
                              return `Subject: ${label}`
                            }}
                          />
                          <Bar dataKey="attempts" radius={[8, 8, 0, 0]}>
                            {subjectStats.map((entry, index) => {
                              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            })}
                            <LabelList
                              position="top"
                              offset={10}
                              className="fill-gray-900"
                              fontSize={10}
                              fontWeight={500}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No analytics data available</p>
                        <p className="text-sm">Data will appear as users take exams</p>
                        <p className="text-xs mt-2">Debug: subjectStats.length = {subjectStats.length}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Online Students */}
              <Card className="h-80 flex flex-col shadow-xs border border-gray-200 bg-white rounded-md p-0 overflow-hidden">
                <div className="px-4 pt-3 pb-0">
                  <div className="text-base font-semibold p-0 m-0">Online Students</div>
                  <div className="text-sm text-muted-foreground p-0 m-0 mt-0 mb-0">Currently active students in the system</div>
                </div>
                <CardContent className="flex-1 p-4 pt-0 mt-0 m-0 min-h-0 flex flex-col justify-start overflow-y-auto">
                  <div className="flex flex-col gap-3 pt-0 mt-0">
                    {onlineUsers.length > 0 ? (
                      onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 text-sm bg-gray-50">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage 
                              src={user.avatar ? (user.avatar.startsWith('http://') || user.avatar.startsWith('https://') || user.avatar.startsWith('/')) ? user.avatar : `/api/images/uploaded/${user.avatar}` : undefined} 
                              alt={user.name} 
                            />
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-gray-900 font-medium">{user.name}</p>
                              <Badge className={`text-xs px-2 py-0.5 ${user.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {user.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">Last seen: {user.lastSeen}</p>
                              <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                                {user.role}
                              </Badge>
                            </div>
                          </div>
                          <div className={`w-3 h-3 ${getStatusColor(user.status)} rounded-full flex-shrink-0`}></div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No students found</p>
                        <p className="text-sm">Students will appear here when they&apos;re active</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
