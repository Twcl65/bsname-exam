"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

interface UserListDialogProps {
    isOpen: boolean
    onClose: () => void
    subjectId: string
    subjectName: string
    onUserClick: (user: User) => void
}

export function UserListDialog({ isOpen, onClose, subjectId, subjectName, onUserClick }: UserListDialogProps) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/progress/subject-users?subjectId=${subjectId}`)
            console.log('API response status:', response.status)
            console.log('API response headers:', response.headers)
            
            const responseText = await response.text()
            console.log('Raw response text:', responseText)
            
            let result
            try {
                result = JSON.parse(responseText)
            } catch (parseError) {
                console.error('JSON parse error:', parseError)
                console.error('Response was not valid JSON:', responseText)
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`)
            }
            
            if (result.success) {
                // Convert date strings back to Date objects
                const usersWithDates = result.data.map((user: { id: string; studentId: string; fullName: string; username: string; profilePicture: string; examCount: number; averageScore: string; bestScore: string; worstScore: string; lastExamDate: string }) => ({
                    id: user.id,
                    studentId: user.studentId,
                    fullName: user.fullName,
                    username: user.username,
                    profilePicture: user.profilePicture,
                    examCount: user.examCount,
                    averageScore: user.averageScore,
                    bestScore: user.bestScore,
                    worstScore: user.worstScore,
                    lastExamDate: new Date(user.lastExamDate)
                }))
                setUsers(usersWithDates)
            } else {
                console.error('Failed to fetch users:', result.error)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }, [subjectId])

    useEffect(() => {
        if (isOpen && subjectId) {
            fetchUsers()
        }
    }, [isOpen, subjectId, fetchUsers])

    const handleUserClick = (user: User) => {
        onUserClick(user)
    }


    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw]">
                    <DialogHeader>
                        <DialogTitle>Students who took {subjectName} exams</DialogTitle>
                        <DialogDescription>
                            Click on a student to view their detailed exam history
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading students...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No students have taken exams for this subject yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {users.map((user) => (
                                    <div key={user.id} className="border border-gray-300 rounded-sm p-4 hover:bg-gray-50 transition-colors">
                                        {/* Desktop Layout */}
                                        <div className="hidden sm:block">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.profilePicture} alt={user.fullName} />
                                                        <AvatarFallback>
                                                            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-sm truncate">{user.fullName}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {user.studentId} • @{user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-black text-white border-black hover:bg-gray-800 hover:text-white h-8 px-4 text-xs"
                                                    onClick={() => handleUserClick(user)}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-4 gap-3 text-sm">
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{user.examCount}</p>
                                                    <p className="text-xs text-gray-500">Exams</p>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{user.averageScore}</p>
                                                    <p className="text-xs text-gray-500">Average</p>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{user.bestScore}</p>
                                                    <p className="text-xs text-gray-500">Best</p>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium text-xs">{user.lastExamDate.toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">Last Exam</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile Layout */}
                                        <div className="sm:hidden space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.profilePicture} alt={user.fullName} />
                                                    <AvatarFallback>
                                                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm truncate">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {user.studentId} • @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{user.examCount}</p>
                                                    <p className="text-xs text-gray-500">Exams</p>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{user.averageScore}</p>
                                                    <p className="text-xs text-gray-500">Average</p>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{user.bestScore}</p>
                                                    <p className="text-xs text-gray-500">Best</p>
                                                </div>
                                                <div className="text-center p-2 bg-gray-50 rounded">
                                                    <p className="font-medium text-xs">{user.lastExamDate.toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">Last Exam</p>
                                                </div>
                                            </div>
                                            
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full bg-black text-white border-black hover:bg-gray-800 hover:text-white h-8 text-xs"
                                                onClick={() => handleUserClick(user)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
