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
import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"
import { 
    BookOpen, 
    Clock, 
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

interface ExamHistory {
    id: string
    subject_name: string
    difficulty_level: string
    score_percentage: number
    total_questions: number
    correct_answers: number
    time_taken: number
    created_at: string
}

interface SubjectStats {
    subject_name: string
    attempts: number
    average_score: number
}

export default function StudentDashboard() {
    const { user } = useUser()
    const [examHistory, setExamHistory] = useState<ExamHistory[]>([])
    const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
    const [loading, setLoading] = useState(true)
    const [totalExams, setTotalExams] = useState(0)

    const fetchDashboardData = useCallback(async () => {
        try {
            console.log('Fetching dashboard data for user:', user?.id)
            
            // Fetch latest 5 exam scores
            const historyResponse = await fetch(`/api/exam-history?userId=${user?.id}&limit=5`)
            console.log('History response status:', historyResponse.status)
            
            if (!historyResponse.ok) {
                throw new Error(`HTTP error! status: ${historyResponse.status}`)
            }
            
            const historyData = await historyResponse.json()
            console.log('History data:', historyData)
            
            if (historyData.success) {
                setExamHistory(historyData.data)
                
                // Calculate total exams
                const total = historyData.data.length
                setTotalExams(total)
            } else {
                console.error('History API error:', historyData.error)
            }

            // Fetch all exam history to calculate subject stats
            const allHistoryResponse = await fetch(`/api/exam-history?userId=${user?.id}&limit=100`)
            console.log('All history response status:', allHistoryResponse.status)
            
            if (!allHistoryResponse.ok) {
                throw new Error(`HTTP error! status: ${allHistoryResponse.status}`)
            }
            
            const allHistoryData = await allHistoryResponse.json()
            console.log('All history data:', allHistoryData)
            
            if (allHistoryData.success) {
                // Group by subject and calculate stats
                const subjectMap = new Map<string, { attempts: number, totalScore: number }>()
                
                allHistoryData.data.forEach((exam: ExamHistory) => {
                    const subjectName = exam.subject_name || 'Unknown Subject'
                    const existing = subjectMap.get(subjectName) || { attempts: 0, totalScore: 0 }
                    subjectMap.set(subjectName, {
                        attempts: existing.attempts + 1,
                        totalScore: existing.totalScore + exam.score_percentage
                    })
                })

                const stats: SubjectStats[] = Array.from(subjectMap.entries())
                    .map(([subject_name, data]) => ({
                        subject_name,
                        attempts: data.attempts,
                        average_score: Math.round(data.totalScore / data.attempts)
                    }))
                    .sort((a, b) => b.attempts - a.attempts)
                    .slice(0, 6) // Top 6 subjects

                setSubjectStats(stats)
            } else {
                console.error('All history API error:', allHistoryData.error)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData()
        }
    }, [user?.id, fetchDashboardData])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }


    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500'
            case 'Medium': return 'bg-yellow-500'
            case 'Hard': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    return (
        <ProtectedRoute allowedRoles={['student']}>
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
                                        <BreadcrumbPage>Student Dashboard</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
                        {/* Welcome Section */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage 
                                    src={user?.avatar ? (user.avatar.startsWith('http://') || user.avatar.startsWith('https://') || user.avatar.startsWith('/')) ? user.avatar : `/api/images/uploaded/${user.avatar}` : undefined} 
                                    alt={user?.name || 'Student'} 
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-lg font-bold text-gray-900">Welcome back, {user?.name || 'Student'}!</div>
                                <div className="text-sm text-gray-500">Here&apos;s your learning progress overview</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-0 px-0 py-0">
                            <div>
                                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                                    <div className="w-10 h-10 flex items-center justify-center bg-red-500 rounded-lg shadow-md">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col justify-center h-full">
                                        <span className="text-xs text-muted-foreground font-medium">Total Exams</span>
                                        <span className="text-base font-bold text-gray-900">{totalExams}</span>
                                    </div>
                                </Card>
                            </div>
                            <div>
                                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                                    <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-lg shadow-md">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col justify-center h-full">
                                        <span className="text-xs text-muted-foreground font-medium">Subjects Studied</span>
                                        <span className="text-base font-bold text-gray-900">{subjectStats.length}</span>
                                    </div>
                                </Card>
                            </div>
                            <div>
                                <Card className="flex flex-row items-center gap-4 h-16 w-full p-4 border border-gray-200 bg-white shadow-xs rounded-lg">
                                    <div className="w-10 h-10 flex items-center justify-center bg-black rounded-lg shadow-md">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col justify-center h-full">
                                        <span className="text-xs text-muted-foreground font-medium">Study Time</span>
                                        <span className="text-base font-bold text-gray-900">3h</span>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Bottom Section - Progress Overview and Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-0 py-0">
                            {/* Subject Progress Overview */}
                            <Card className="h-80 flex flex-col shadow-xs border border-gray-200 bg-white rounded-md p-0 overflow-hidden">
                                <div className="px-4 pt-3 pb-0 mb-0">
                                    <div className="text-base font-semibold p-0 m-0">Subject Progress Overview</div>
                                    <div className="text-sm text-muted-foreground p-0 m-0 mt-0 mb-0">Most attempted subjects</div>
                                </div>
                                <CardContent className="flex-1 p-4 pt-2 mt-0 m-0 min-h-0 flex flex-col justify-start overflow-y-auto">
                                    {loading ? (
                                        <div className="h-[300px] flex items-center justify-center">
                                            <div className="text-muted-foreground">Loading chart...</div>
                                        </div>
                                    ) : subjectStats.length > 0 ? (
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
                                                            'Attempts'
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
                                                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No exam data available</p>
                                                <p className="text-sm">Take some exams to see your progress!</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card className="h-80 flex flex-col shadow-xs border border-gray-200 bg-white rounded-md p-0 overflow-hidden">
                                <div className="px-4 pt-3 pb-0">
                                    <div className="text-base font-semibold p-0 m-0">Recent Activity</div>
                                    <div className="text-sm text-muted-foreground p-0 m-0 mt-0 mb-0">Latest exam scores and updates</div>
                                </div>
                                <CardContent className="flex-1 p-4 pt-0 mt-0 m-0 min-h-0 flex flex-col justify-start overflow-y-auto">
                                    <div className="flex flex-col gap-3 pt-0 mt-0">
                                        {loading ? (
                                            <div className="space-y-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="animate-pulse">
                                                        <div className="h-14 bg-gray-200 rounded border"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : examHistory.length > 0 ? (
                                            examHistory.map((exam) => (
                                                <div key={exam.id} className="flex items-start gap-3 px-3 py-2 rounded-md border border-gray-200 text-sm bg-gray-50">
                                                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                                                        <BookOpen className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-gray-900 font-medium">{exam.subject_name}</p>
                                                            <Badge 
                                                                className={`text-xs px-2 py-0.5 ${getDifficultyColor(exam.difficulty_level)} text-white`}
                                                            >
                                                                {exam.difficulty_level}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-muted-foreground">{formatDate(exam.created_at)}</p>
                                                            <p className="text-xs text-muted-foreground">Completed</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-muted-foreground">No recent activity</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
