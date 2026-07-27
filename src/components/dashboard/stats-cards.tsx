"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, BookOpen, FileText, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    icon: React.ReactNode
    description?: string
}

function StatCard({ title, value, change, icon, description }: StatCardProps) {
    const isPositive = change && change > 0
    const isNegative = change && change < 0

    return (
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">{value}</div>
                {change !== undefined && (
                    <div className="flex items-center space-x-1 text-xs">
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : isNegative ? (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : null}
                        <span className={isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"}>
                            {change > 0 ? "+" : ""}{change}%
                        </span>
                        <span className="text-muted-foreground">from last month</span>
                    </div>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    )
}

export function StatsCards() {
    const stats = [
        {
            title: "Total Students",
            value: "2,847",
            change: 12.5,
            icon: <Users className="h-4 w-4" />,
            description: "Registered students across all programs"
        },
        {
            title: "Active Users",
            value: "1,923",
            change: 8.2,
            icon: <UserCheck className="h-4 w-4" />,
            description: "Students active in the last 30 days"
        },
        {
            title: "Subjects",
            value: "24",
            change: 0,
            icon: <BookOpen className="h-4 w-4" />,
            description: "Available course subjects"
        },
        {
            title: "Total Exams Taken",
            value: "15,642",
            change: 23.1,
            icon: <FileText className="h-4 w-4" />,
            description: "Cumulative exam attempts"
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    )
}
