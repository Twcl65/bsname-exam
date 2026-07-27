"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, TrendingUp, Users, Award } from "lucide-react"

interface TopSubject {
    id: string
    name: string
    passRate: number
    totalAttempts: number
    averageScore: number
    rank: number
    improvement: number
    description: string
    category: string
}

export function TopSubjectsWithHighestPassingScores() {
    const topSubjects: TopSubject[] = [
        {
            id: "1",
            name: "Weather Systems",
            passRate: 88.5,
            totalAttempts: 1500,
            averageScore: 87.2,
            rank: 1,
            improvement: 3.2,
            description: "Understanding meteorological patterns and weather forecasting",
            category: "Navigation"
        },
        {
            id: "2",
            name: "Safety Procedures",
            passRate: 85.0,
            totalAttempts: 1800,
            averageScore: 84.8,
            rank: 2,
            improvement: 2.1,
            description: "Maritime safety protocols and emergency procedures",
            category: "Safety"
        },
        {
            id: "3",
            name: "Navigation",
            passRate: 82.3,
            totalAttempts: 2100,
            averageScore: 81.5,
            rank: 3,
            improvement: 4.7,
            description: "Celestial and electronic navigation techniques",
            category: "Navigation"
        },
        {
            id: "4",
            name: "Ship Operations",
            passRate: 79.8,
            totalAttempts: 1950,
            averageScore: 78.9,
            rank: 4,
            improvement: 1.8,
            description: "Daily ship operations and maintenance procedures",
            category: "Operations"
        },
        {
            id: "5",
            name: "Marine Engineering",
            passRate: 78.2,
            totalAttempts: 2450,
            averageScore: 76.4,
            rank: 5,
            improvement: 2.9,
            description: "Marine propulsion systems and engineering principles",
            category: "Engineering"
        }
    ]

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Award className="h-5 w-5 text-yellow-500" />
            case 2:
                return <Award className="h-5 w-5 text-gray-400" />
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />
            default:
                return <BookOpen className="h-5 w-5 text-blue-500" />
        }
    }

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return <Badge className="bg-yellow-500 text-white">#1</Badge>
            case 2:
                return <Badge className="bg-gray-400 text-white">#2</Badge>
            case 3:
                return <Badge className="bg-amber-600 text-white">#3</Badge>
            default:
                return <Badge variant="outline">#{rank}</Badge>
        }
    }

    const getPassRateColor = (rate: number) => {
        if (rate >= 85) return "text-green-600"
        if (rate >= 80) return "text-blue-600"
        if (rate >= 75) return "text-yellow-600"
        return "text-gray-600"
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Navigation":
                return "bg-blue-100 text-blue-800"
            case "Safety":
                return "bg-green-100 text-green-800"
            case "Operations":
                return "bg-purple-100 text-purple-800"
            case "Engineering":
                return "bg-orange-100 text-orange-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-primary flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Top 5 Subjects with Highest Passing Scores</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topSubjects.map((subject) => (
                        <div key={subject.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        {getRankIcon(subject.rank)}
                                        {getRankBadge(subject.rank)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{subject.name}</h3>
                                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                                    </div>
                                </div>
                                <Badge className={getCategoryColor(subject.category)}>
                                    {subject.category}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${getPassRateColor(subject.passRate)}`}>
                                        {subject.passRate}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">
                                        {subject.averageScore}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Average Score</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">
                                        {subject.totalAttempts.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Pass Rate Progress</span>
                                    <div className="flex items-center space-x-1 text-green-600">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>+{subject.improvement}%</span>
                                    </div>
                                </div>
                                <Progress value={subject.passRate} className="h-2" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Rankings based on pass rates, average scores, and total exam attempts</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
