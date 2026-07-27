"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useUser } from "@/contexts/UserContext"
import { 
    Clock, 
    Flag, 
    Eye, 
    RotateCcw,
    Home,
    Trophy,
    X
} from "lucide-react"

interface Question {
    id: string
    subtopicId: string
    subtopicName: string
    questionText: string
    questionImage?: string
    optionA: string
    optionAImage?: string
    optionB: string
    optionBImage?: string
    optionC: string
    optionCImage?: string
    optionD: string
    optionDImage?: string
    correctAnswer: string
    explanation?: string
    difficultyLevel: string
    points: number
}

interface ExamData {
    examId: string
    subjectId: string
    difficulty: string
    totalQuestions: number
    questions: Question[]
    timeLimit: number
    createdAt: string
}

interface ExamDialogProps {
    isOpen: boolean
    examData: ExamData | null
    subjectTime?: number
    onClose: () => void
}

interface UserAnswer {
    questionId: string
    selectedAnswer: string
    isFlagged: boolean
    timeSpent: number
}

export function ExamDialog({ isOpen, examData, subjectTime, onClose }: ExamDialogProps) {
    const { user } = useUser()
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({})
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
    const [timeRemaining, setTimeRemaining] = useState((subjectTime || 3) * 60 * 60) // Convert hours to seconds
    const [examStarted, setExamStarted] = useState(false)
    const [showReview, setShowReview] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [examCompleted, setExamCompleted] = useState(false)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const [showQuestionNavigator, setShowQuestionNavigator] = useState(false)
    const [examStartTime, setExamStartTime] = useState<number | null>(null)
    const [savingExamHistory, setSavingExamHistory] = useState(false)

    // Reset timer when subjectTime changes
    useEffect(() => {
        setTimeRemaining((subjectTime || 3) * 60 * 60)
    }, [subjectTime])

    // Handle dialog open/close state changes
    const handleOpenChange = useCallback((open: boolean) => {
        if (!open && examStarted && !examCompleted) {
            // Prevent closing if exam is in progress
            return
        }
        if (!open) {
            onClose()
        }
    }, [examStarted, examCompleted, onClose])

    // Prevent page refresh
    useEffect(() => {
        if (examStarted && !examCompleted) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault()
                e.returnValue = "Are you sure you want to leave? Your progress will be lost."
                return "Are you sure you want to leave? Your progress will be lost."
            }

            window.addEventListener('beforeunload', handleBeforeUnload)
            return () => window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [examStarted, examCompleted])

    const calculateScore = useCallback(() => {
        if (!examData) return { correct: 0, total: 0, percentage: 0 }

        let correct = 0
        const total = examData.questions.length

        examData.questions.forEach(question => {
            const userAnswer = userAnswers[question.id]
            if (userAnswer && userAnswer.selectedAnswer === question.correctAnswer) {
                correct++
            }
        })

        return {
            correct,
            total,
            percentage: Math.round((correct / total) * 100)
        }
    }, [examData, userAnswers])

    const handleSubmitExam = useCallback(async () => {
        if (!examData || !user) {
            console.error('Missing exam data or user information')
            return
        }

        // Calculate exam results first
        const score = calculateScore()
        const timeTaken = examStartTime ? Math.floor((Date.now() - examStartTime) / 1000) : null

        // Show exam completed screen immediately
        setExamCompleted(true)
        setShowResults(true)
        setShowReview(false) // Close review modal if open

        // Save exam history to database in background
        setSavingExamHistory(true)
        
        try {
            const examDataToSend = {
                userId: user.id,
                subjectId: examData.subjectId,
                examId: examData.examId,
                difficultyLevel: examData.difficulty,
                totalQuestions: examData.totalQuestions,
                correctAnswers: score.correct,
                scorePercentage: score.percentage,
                timeTaken: timeTaken,
                userAnswers: userAnswers
            }
            
            console.log('Sending exam data to API:', examDataToSend)
            
            const response = await fetch('/api/exam-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(examDataToSend)
            })

            console.log('API response status:', response.status)
            const result = await response.json()
            console.log('API response data:', result)
            
            if (result.success) {
                console.log('Exam history saved successfully:', result.data)
            } else {
                console.error('Failed to save exam history:', result.error)
                console.error('Error details:', result.details)
            }
        } catch (error) {
            console.error('Error saving exam history:', error)
        } finally {
            setSavingExamHistory(false)
        }
    }, [examData, user, examStartTime, userAnswers, calculateScore])

    // Timer effect
    useEffect(() => {
        if (examStarted && timeRemaining > 0 && !examCompleted) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        // Auto-submit when time runs out
                        if (examData && user) {
                            // Show exam completed screen immediately
                            setExamCompleted(true)
                            setShowResults(true)
                            setShowReview(false)
                            
                            // Save exam history in background
                            setSavingExamHistory(true)
                            handleSubmitExam()
                        }
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [examStarted, timeRemaining, examCompleted, examData, user, examStartTime, handleSubmitExam])

    // Track time spent on current question
    useEffect(() => {
        if (examStarted && !examCompleted) {
            setQuestionStartTime(Date.now())
        }
    }, [currentQuestionIndex, examStarted, examCompleted])

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startExam = () => {
        setExamStarted(true)
        setTimeRemaining((subjectTime || 3) * 60 * 60) // Reset to subject time in seconds
        setExamStartTime(Date.now())
    }

    const handleAnswerSelect = (answer: string) => {
        if (!examData || examCompleted) return

        const currentQuestion = examData.questions[currentQuestionIndex]
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)

        // Remove flag when question is answered
        const newFlaggedQuestions = new Set(flaggedQuestions)
        newFlaggedQuestions.delete(currentQuestionIndex)
        setFlaggedQuestions(newFlaggedQuestions)

        setUserAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: {
                questionId: currentQuestion.id,
                selectedAnswer: answer,
                isFlagged: false, // Remove flag when answered
                timeSpent
            }
        }))
    }

    const toggleFlag = () => {
        if (!examData || examCompleted) return

        const currentQuestion = examData.questions[currentQuestionIndex]
        const userAnswer = userAnswers[currentQuestion.id]
        
        // Don't allow flagging if question is already answered
        if (userAnswer && userAnswer.selectedAnswer && userAnswer.selectedAnswer.trim() !== '') {
            return
        }

        const newFlagged = new Set(flaggedQuestions)
        if (newFlagged.has(currentQuestionIndex)) {
            newFlagged.delete(currentQuestionIndex)
        } else {
            newFlagged.add(currentQuestionIndex)
        }
        setFlaggedQuestions(newFlagged)

        // Update user answer if it exists (for tracking flag status)
        if (userAnswers[currentQuestion.id]) {
            setUserAnswers(prev => ({
                ...prev,
                [currentQuestion.id]: {
                    ...prev[currentQuestion.id],
                    isFlagged: newFlagged.has(currentQuestionIndex)
                }
            }))
        }
    }

    const goToQuestion = (index: number) => {
        if (!examData || examCompleted) return

        // Find the highest question number that has been answered
        let highestAnsweredIndex = -1
        for (let i = 0; i < examData.totalQuestions; i++) {
            const question = examData.questions[i]
            const userAnswer = userAnswers[question.id]
            if (userAnswer && userAnswer.selectedAnswer && userAnswer.selectedAnswer.trim() !== '') {
                highestAnsweredIndex = i
            }
        }
        
        // Allow navigation to any question up to the highest answered question
        if (index <= highestAnsweredIndex) {
            setCurrentQuestionIndex(index)
        }
    }

    const nextQuestion = () => {
        if (!examData || examCompleted) return
        if (currentQuestionIndex < examData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const previousQuestion = () => {
        if (!examData || examCompleted) return
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }




    if (!examData) return null

    const currentQuestion = examData.questions[currentQuestionIndex]
    const userAnswer = userAnswers[currentQuestion.id]
    const isQuestionAnswered = !!(userAnswer && userAnswer.selectedAnswer && userAnswer.selectedAnswer.trim() !== '')

    return (
        <Dialog open={isOpen} onOpenChange={showResults ? undefined : handleOpenChange}>
            <DialogContent className="w-[95vw] h-[90vh] max-w-[95vw] max-h-[90vh] p-0 overflow-hidden [&>button]:hidden sm:w-[98vw] sm:h-[95vh] sm:max-w-[98vw] sm:max-h-[95vh] !w-[95vw] !h-[90vh] !max-w-[95vw] !max-h-[90vh] sm:!w-[98vw] sm:!h-[95vh] sm:!max-w-[98vw] sm:!max-h-[95vh]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Exam Interface</DialogTitle>
                </DialogHeader>
                {!examStarted ? (
                    // Exam Start Screen
                    <div className="flex flex-col items-center justify-center h-full p-6 bg-white overflow-y-auto relative">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        <div className="text-center space-y-4 max-w-lg w-full">
                            <div className="space-y-3">
                                <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
                                <h1 className="text-2xl font-bold text-gray-900">Exam Ready</h1>
                                <p className="text-base text-gray-600">
                                    You are about to start a {examData.difficulty} level exam
                                </p>
                            </div>

                            <Card className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">Total Questions:</span>
                                        <Badge variant="outline" className="text-sm px-2 py-1">
                                            {examData.totalQuestions}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">Time Limit:</span>
                                        <Badge variant="outline" className="text-sm px-2 py-1">
                                            {subjectTime ? `${subjectTime} Hour${subjectTime !== 1 ? 's' : ''}` : '3 Hours'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">Difficulty:</span>
                                        <Badge 
                                            className={`text-sm px-2 py-1 ${
                                                examData.difficulty === 'Easy' ? 'bg-green-500' :
                                                examData.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        >
                                            {examData.difficulty}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">Exam Rules:</h3>
                                <ul className="text-left space-y-1 text-xs text-gray-600">
                                    <li>• You have {subjectTime || 3} hour{(subjectTime || 3) !== 1 ? 's' : ''} to complete the exam</li>
                                    <li>• You can flag questions for review</li>
                                    <li>• You can navigate between questions</li>
                                    <li>• Once started, you cannot close or refresh the page</li>
                                    <li>• Review your answers before submitting</li>
                                </ul>
                            </div>

                            <div className="pt-2">
                                <Button 
                                    onClick={startExam}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm w-full"
                                >
                                    Start Exam
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : showResults ? (
                    // Results Screen
                    <div className="flex flex-col h-full p-4 sm:p-6 bg-white overflow-y-auto relative">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="text-center space-y-4 sm:space-y-6">
                            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-500" />
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Exam Completed!</h1>
                            
                            <Card className="max-w-md mx-auto p-4 sm:p-6">
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="text-center">
                                        <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">Exam Done</div>
                                        <div className="text-lg sm:text-xl text-gray-600">for this subject</div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="text-center space-y-2">
                                        <div className="text-sm text-gray-600">
                                            Please wait for the result
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Your exam has been submitted successfully
                                        </div>
                                    </div>
                                </div>
                            </Card>


                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                <Button 
                                    onClick={() => {
                                        setShowResults(false)
                                        setExamCompleted(false)
                                        setExamStarted(false)
                                        setCurrentQuestionIndex(0)
                                        setUserAnswers({})
                                        setFlaggedQuestions(new Set())
                                        setExamStartTime(null)
                                        setSavingExamHistory(false)
                                    }}
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retake
                                </Button>
                                <Button 
                                    onClick={onClose}
                                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Select Other Subject to Take
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Main Exam Interface
                    <div className="flex h-full flex-col overflow-hidden">
                        {/* Top Header */}
                        <div className="p-2 sm:p-4 border-b bg-white flex-shrink-0">
                            <div className="relative flex items-center justify-between mb-2 sm:mb-3">
                                {/* Left side - Easy badge */}
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <Badge 
                                        className={`text-xs sm:text-sm ${
                                            currentQuestion.difficultyLevel === 'Easy' ? 'bg-green-500' :
                                            currentQuestion.difficultyLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    >
                                        {currentQuestion.difficultyLevel}
                                    </Badge>
                                  
                                </div>
                                
                                {/* Center - Timer */}
                                <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg font-mono">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                    <span className={timeRemaining < 300 ? "text-red-600 font-bold" : "text-gray-700"}>
                                        {formatTime(timeRemaining)}
                                    </span>
                                </div>
                                
                                {/* Right side - Flag, Navigator */}
                                <div className="flex items-center gap-2 sm:gap-4">
                                    {/* Flag Button */}
                                    <Button
                                        onClick={toggleFlag}
                                        variant={flaggedQuestions.has(currentQuestionIndex) ? "default" : "outline"}
                                        size="sm"
                                        className="text-xs sm:text-sm px-2 sm:px-3"
                                        disabled={isQuestionAnswered}
                                    >
                                        <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline ml-1 sm:ml-2">
                                            {isQuestionAnswered 
                                                ? 'Answered' 
                                                : flaggedQuestions.has(currentQuestionIndex) ? 'Unflag' : 'Flag'
                                            }
                                        </span>
                                    </Button>
                                    
                                    {/* Question Navigator Dialog Button */}
                                    <Button
                                        onClick={() => setShowQuestionNavigator(true)}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs sm:text-sm px-2 sm:px-3"
                                    >
                                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline ml-1 sm:ml-2">Navigator</span>
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full">
                                <Progress 
                                    value={(currentQuestionIndex + 1) / examData.totalQuestions * 100} 
                                    className="h-2"
                                />
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col min-h-0">

                            {/* Question Content */}
                            <div className="flex-1 p-3 sm:p-4 overflow-y-auto min-h-0">
                                <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                                    {/* Question */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <h3 className="text-lg sm:text-xl font-semibold">
                                            Question {currentQuestionIndex + 1}
                                        </h3>
                                        
                                        <div className="text-base sm:text-lg leading-relaxed">
                                            {currentQuestion.questionText}
                                        </div>
                                        
                                        {currentQuestion.questionImage && (
                                            <div className="relative w-full max-w-4xl mx-auto max-h-80 overflow-auto border rounded-lg">
                                                <Image
                                                    src={currentQuestion.questionImage.startsWith('https://') 
                                                        ? currentQuestion.questionImage 
                                                        : `/api/images/uploaded/${String(currentQuestion.questionImage)}`}
                                                    alt="Question"
                                                    width={1000}
                                                    height={500}
                                                    className="rounded-lg w-full h-auto"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-3 pb-4">
                                        {['A', 'B', 'C', 'D'].map((option) => {
                                            const optionText = currentQuestion[`option${option}` as keyof Question] as string
                                            const optionImage = currentQuestion[`option${option}Image` as keyof Question] as string
                                            const isSelected = userAnswer?.selectedAnswer === option
                                            
                                            return (
                                                <div
                                                    key={option}
                                                    onClick={() => handleAnswerSelect(option)}
                                                    className={`
                                                        p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all relative z-10
                                                        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                                                    `}
                                                >
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        <div className={`
                                                            w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0
                                                            ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-gray-600'}
                                                        `}>
                                                            {option}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm sm:text-base break-words leading-relaxed">{optionText}</div>
                                                            {optionImage && (
                                                                <div className="mt-2 relative w-full max-w-lg max-h-40 overflow-auto border rounded">
                                                                    <Image
                                                                        src={optionImage.startsWith('https://') 
                                                                            ? optionImage 
                                                                            : `/api/images/uploaded/${String(optionImage)}`}
                                                                        alt={`Option ${option}`}
                                                                        width={600}
                                                                        height={300}
                                                                        className="rounded w-full h-auto"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bottom Navigation */}
                            <div className="p-4 border-t bg-white flex-shrink-0 relative z-10">
                                <div className="flex items-center justify-center">
                                    {(() => {
                                        // Count questions that have been answered by checking each question index
                                        let answeredCount = 0
                                        for (let i = 0; i < examData.totalQuestions; i++) {
                                            const question = examData.questions[i]
                                            const userAnswer = userAnswers[question.id]
                                            if (userAnswer && userAnswer.selectedAnswer && userAnswer.selectedAnswer.trim() !== '') {
                                                answeredCount++
                                            }
                                        }
                                        const allAnswered = answeredCount === examData.totalQuestions
                                        
                                        // Debug logging
                                  
                                        // Show submit button if all questions are answered, regardless of correctness
                                        const shouldShowSubmit = allAnswered
                                        
                                      
                                        if (shouldShowSubmit) {
                                            return (
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-sm text-green-600 font-medium">
                                                        All questions answered! ({answeredCount}/{examData.totalQuestions})
                                                    </span>
                                                    <Button
                                                        onClick={() => setShowReview(true)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                                                        size="lg"
                                                    >
                                                        Review Answers
                                                    </Button>
                                                </div>
                                            )
                                        } else {
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={previousQuestion}
                                                        disabled={currentQuestionIndex === 0}
                                                        className="bg-gray-300 hover:bg-gray-700 hover:text-white text-black px-6"
                                                        size="sm"
                                                    >
                                                        Previous
                                                    </Button>
                                                    <span className="text-sm text-gray-600 mx-4">
                                                        Question {currentQuestionIndex + 1} of {examData.totalQuestions}
                                                    </span>
                                                    <Button
                                                        onClick={nextQuestion}
                                                        disabled={currentQuestionIndex === examData.questions.length - 1}
                                                        className="bg-black hover:bg-black text-white px-6"
                                                        size="sm"
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            )
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Modal */}
                {showReview && (
                    <Dialog open={showReview} onOpenChange={setShowReview}>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-gray-900">Review Your Answers</DialogTitle>
                                <p className="text-sm text-gray-600 mt-2">
                                    Please review all your answers before submitting. You can click on any question to go back and make changes.
                                </p>
                            </DialogHeader>
                            <div className="space-y-4">
                                
                                <div className="grid gap-4">
                                    {examData.questions.map((question, index) => {
                                        const userAnswer = userAnswers[question.id]
                                        const isFlagged = flaggedQuestions.has(index)
                                        
                                        return (
                                            <Card key={`review-${index}-${question.id}`} className="p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">Question {index + 1}</h4>
                                                        <div className="flex gap-2">
                                                            {isFlagged && (
                                                                <Badge variant="outline" className="text-yellow-600">
                                                                    <Flag className="w-3 h-3 mr-1" />
                                                                    Flagged
                                                                </Badge>
                                                            )}
                                                            {userAnswer ? (
                                                                <Badge className="bg-green-500">Answered</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-red-600">Not Answered</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                        {question.questionText}
                                                    </div>
                                                    
                                                    {/* Question Image in Review */}
                                                    {question.questionImage && (
                                                        <div className="relative w-full max-w-sm mx-auto max-h-48 overflow-auto border rounded-lg">
                                                            <Image
                                                                src={question.questionImage}
                                                                alt="Question"
                                                                width={300}
                                                                height={150}
                                                                className="rounded-lg w-full h-auto"
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    {userAnswer && (
                                                        <div className="text-sm">
                                                            <span className="font-medium">Your Answer: </span>
                                                            <Badge variant="outline">{userAnswer.selectedAnswer}</Badge>
                                                        </div>
                                                    )}
                                                    
                                                    <Button
                                                        onClick={() => {
                                                            setCurrentQuestionIndex(index)
                                                            setShowReview(false)
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Go to Question
                                                    </Button>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                                
                                {/* Submit Exam Button - Prominently Displayed */}
                                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                                    <div className="text-center space-y-3">
                                        <div className="text-lg font-semibold text-gray-900">
                                            Ready to Submit Your Exam?
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Once submitted, you cannot make any changes to your answers.
                                        </div>
                                        <Button 
                                            onClick={handleSubmitExam} 
                                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
                                            disabled={savingExamHistory}
                                            size="lg"
                                        >
                                            {savingExamHistory ? "Submitting..." : "Submit Exam"}
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowReview(false)}>
                                        Close Review
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Question Navigator Dialog */}
                {showQuestionNavigator && (
                    <Dialog open={showQuestionNavigator} onOpenChange={setShowQuestionNavigator}>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Question Navigator</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-10 gap-2">
                                    {examData.questions.map((question, index) => {
                                        const userAnswer = userAnswers[question.id]
                                        const isFlagged = flaggedQuestions.has(index)
                                        const isCurrent = index === currentQuestionIndex
                                        const isAnswered = userAnswer && userAnswer.selectedAnswer
                                        
                                        // Find the highest question number that has been answered
                                        let highestAnsweredIndex = -1
                                        for (let i = 0; i < examData.totalQuestions; i++) {
                                            const question = examData.questions[i]
                                            const userAnswer = userAnswers[question.id]
                                            if (userAnswer && userAnswer.selectedAnswer && userAnswer.selectedAnswer.trim() !== '') {
                                                highestAnsweredIndex = i
                                            }
                                        }
                                        
                                        const canNavigate = index <= highestAnsweredIndex
                                        
                                        return (
                                            <button
                                                key={`navigator-${index}-${question.id}`}
                                                onClick={() => {
                                                    goToQuestion(index)
                                                    setShowQuestionNavigator(false)
                                                }}
                                                className={`
                                                    w-8 h-8 text-xs font-medium rounded border-2 transition-all
                                                    ${isCurrent ? 'border-blue-500 bg-blue-100 text-blue-700' :
                                                      isAnswered ? 'border-green-500 bg-green-100 text-green-700' :
                                                      isFlagged ? 'border-yellow-500 bg-yellow-100 text-yellow-700' :
                                                      'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}
                                                    ${canNavigate ? 'cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed'}
                                                `}
                                            >
                                                {index + 1}
                                                {isFlagged && <Flag className="w-3 h-3 absolute -top-1 -right-1" />}
                                            </button>
                                        )
                                    })}
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-green-500 bg-green-100 rounded"></div>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-100 rounded"></div>
                                        <span>Flagged</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-gray-300 bg-white rounded"></div>
                                        <span>Unanswered</span>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    )
}
