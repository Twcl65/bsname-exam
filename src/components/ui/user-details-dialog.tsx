"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface User {
    id: string
    studentId: string
    fullName: string
    username: string
    profilePicture: string
    examCount: number
    averageScore: string
    bestScore: string
    worstScore: string
    lastExamDate: Date
}

interface ExamHistory {
    id: string
    examId: string
    difficultyLevel: string
    totalQuestions: number
    correctAnswers: number
    scorePercentage: string
    timeTaken: number | null
    createdAt: Date
    subjectName: string
    subjectDescription: string
}

interface UserDetailsDialogProps {
    isOpen: boolean
    onClose: () => void
    user: User
    subjectId: string
    subjectName: string
}

export function UserDetailsDialog({ isOpen, onClose, user, subjectId, subjectName }: UserDetailsDialogProps) {
    const [examHistory, setExamHistory] = useState<ExamHistory[]>([])
    const [loading, setLoading] = useState(false)

    const fetchExamHistory = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/progress/user-exam-history?userId=${user.id}&subjectId=${subjectId}`)
            const result = await response.json()
            
            if (result.success) {
                // Convert date strings back to Date objects
                const examHistoryWithDates = result.data.examHistory.map((exam: { id: string; examId: string; difficultyLevel: string; totalQuestions: number; correctAnswers: number; scorePercentage: string; timeTaken: number | null; createdAt: string; subjectName: string; subjectDescription: string }) => ({
                    id: exam.id,
                    examId: exam.examId,
                    difficultyLevel: exam.difficultyLevel,
                    totalQuestions: exam.totalQuestions,
                    correctAnswers: exam.correctAnswers,
                    scorePercentage: exam.scorePercentage,
                    timeTaken: exam.timeTaken,
                    createdAt: new Date(exam.createdAt),
                    subjectName: exam.subjectName,
                    subjectDescription: exam.subjectDescription
                }))
                setExamHistory(examHistoryWithDates)
            } else {
                console.error('Failed to fetch exam history:', result.error)
            }
        } catch (error) {
            console.error('Error fetching exam history:', error)
        } finally {
            setLoading(false)
        }
    }, [user.id, subjectId])

    useEffect(() => {
        if (isOpen && user.id) {
            fetchExamHistory()
        }
    }, [isOpen, user.id, subjectId, fetchExamHistory])


    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return "bg-green-100 text-green-800"
            case 'medium': return "bg-yellow-100 text-yellow-800"
            case 'hard': return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const formatTime = (seconds: number | null) => {
        if (!seconds || seconds === 0) return "N/A"
        
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`
        } else {
            return `${remainingSeconds}s`
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profilePicture} alt={user.fullName} />
                            <AvatarFallback>
                                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-semibold">{user.fullName}</h2>
                            <p className="text-sm text-muted-foreground">
                                {user.studentId} • @{user.username} • {subjectName}
                            </p>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Detailed exam history and performance statistics
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Exam History Table */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Exam History</h3>
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading exam history...</p>
                            </div>
                        ) : examHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No exam history found for this subject.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {examHistory.map((exam) => (
                                    <div key={exam.id} className="border border-gray-300 rounded-sm p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center">
                                                    <p className="font-medium text-sm">{exam.createdAt.toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">Date</p>
                                                </div>
                                                <div className="text-center">
                                                    <Badge className={getDifficultyColor(exam.difficultyLevel)}>
                                                        {exam.difficultyLevel}
                                                    </Badge>
                                                    <p className="text-xs text-gray-500 mt-1">Difficulty</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-6">
                                                <div className="text-center">
                                                    <p className="font-medium text-sm">{exam.scorePercentage}</p>
                                                    <p className="text-xs text-gray-500">Score</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-medium text-sm">{formatTime(exam.timeTaken)}</p>
                                                    <p className="text-xs text-gray-500">Time Taken</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
