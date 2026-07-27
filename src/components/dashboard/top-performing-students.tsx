"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react"

interface TopStudent {
  id: string
  name: string
  email: string
  overallScore: number
  examsCompleted: number
  rank: number
  avatar?: string
  improvement: number
  subjects: string[]
}

export function TopPerformingStudents() {
  const topStudents: TopStudent[] = [
    {
      id: "1",
      name: "Alexandra Rodriguez",
      email: "alexandra.rodriguez@marinex.com",
      overallScore: 96.8,
      examsCompleted: 24,
      rank: 1,
      improvement: 5.2,
      subjects: ["Marine Engineering", "Navigation", "Safety Procedures"]
    },
    {
      id: "2",
      name: "James Mitchell",
      email: "james.mitchell@marinex.com",
      overallScore: 94.5,
      examsCompleted: 22,
      rank: 2,
      improvement: 3.8,
      subjects: ["Ship Operations", "Maritime Law", "Weather Systems"]
    },
    {
      id: "3",
      name: "Sophie Chen",
      email: "sophie.chen@marinex.com",
      overallScore: 92.1,
      examsCompleted: 20,
      rank: 3,
      improvement: 7.1,
      subjects: ["Marine Engineering", "Navigation", "Ship Operations"]
    },
    {
      id: "4",
      name: "Marcus Thompson",
      email: "marcus.thompson@marinex.com",
      overallScore: 90.7,
      examsCompleted: 19,
      rank: 4,
      improvement: 2.3,
      subjects: ["Safety Procedures", "Maritime Law", "Weather Systems"]
    },
    {
      id: "5",
      name: "Elena Petrov",
      email: "elena.petrov@marinex.com",
      overallScore: 89.3,
      examsCompleted: 18,
      rank: 5,
      improvement: 4.6,
      subjects: ["Marine Engineering", "Ship Operations", "Safety Procedures"]
    }
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Star className="h-5 w-5 text-blue-500" />
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

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-green-600"
    if (score >= 90) return "text-blue-600"
    if (score >= 85) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-primary flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>Top 5 Performing Students</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getRankIcon(student.rank)}
                  {getRankBadge(student.rank)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{student.name}</p>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">+{student.improvement}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {student.subjects.slice(0, 2).map((subject, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                    {student.subjects.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.subjects.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(student.overallScore)}`}>
                  {student.overallScore}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {student.examsCompleted} exams
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Rankings are based on overall performance across all subjects and exam attempts
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
