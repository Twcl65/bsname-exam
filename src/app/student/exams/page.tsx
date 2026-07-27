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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { ExamDialog } from "@/components/ui/exam-dialog"
import { S3Image } from "@/components/ui/s3-image"

interface Subject {
    id: string
    name: string
    description: string
    subject_time?: number
    subject_picture: string | null
    subject_picture_s3_url: string | null
    subtopic_count: number
    total_questions: number
    created_at: string
    difficulty_level?: 'Easy' | 'Medium' | 'Hard'
    subtopics: Array<{
        id: string
        name: string
        questionCount: number
        createdAt: string
    }>
}

export default function StudentExams() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
    const [errorDialogOpen, setErrorDialogOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [generatingExam, setGeneratingExam] = useState(false)
    const [examDialogOpen, setExamDialogOpen] = useState(false)
    const [examData, setExamData] = useState(null)

    useEffect(() => {
        fetchSubjects()
    }, [])

    useEffect(() => {
        // Filter subjects based on search term
        const filtered = subjects.filter(subject => {
            const searchLower = searchTerm.toLowerCase().trim()
            
            // If search is empty, show all subjects
            if (!searchLower) return true
            
            // Search in subject name
            if (subject.name.toLowerCase().includes(searchLower)) return true
            
            // Search in subject description
            if (subject.description && subject.description.toLowerCase().includes(searchLower)) return true
            
            // Search in subtopic names
            if (subject.subtopics && subject.subtopics.some(subtopic =>
                subtopic.name.toLowerCase().includes(searchLower)
            )) return true
            
            return false
        })
        setFilteredSubjects(filtered)
    }, [subjects, searchTerm])

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            const data = await response.json()
            
            if (data.success) {
                setSubjects(data.data)
                setFilteredSubjects(data.data)
            } else {
                console.error('Failed to fetch subjects:', data.error)
            }
        } catch (error) {
            console.error('Error fetching subjects:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }


    const handleSelectSubject = (subject: Subject) => {
        setSelectedSubject(subject)
        setSelectedDifficulty("")
        setDialogOpen(true)
    }

    const handleStartExam = async () => {
        if (!selectedSubject || !selectedDifficulty) {
            alert("Please select a difficulty level")
            return
        }

        setGeneratingExam(true)
        
        try {
            const response = await fetch('/api/exams/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subjectId: selectedSubject.id,
                    difficulty: selectedDifficulty
                })
            })

            const result = await response.json()

            if (result.success) {
                // Exam generated successfully
                console.log("Exam generated:", result.data)
                setExamData(result.data)
                setDialogOpen(false)
                setExamDialogOpen(true)
            } else {
                // Show error dialog
                setErrorMessage(result.message || result.error || "Failed to generate exam")
                setErrorDialogOpen(true)
            }
        } catch (error) {
            console.error("Error generating exam:", error)
            setErrorMessage("Network error. Please try again.")
            setErrorDialogOpen(true)
        } finally {
            setGeneratingExam(false)
        }
    }

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <SidebarProvider>
                <RoleBasedSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/student">
                                            Dashboard
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Exams</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
                        {/* Header Section */}
                         <div className="space-y-1">
                            <div className="text-lg font-bold text-gray-900 mb-0">Available Exams</div>
                            <div className="text-sm text-gray-500">Below are the available exam subjects. Click &quot;Select Subject&quot; to begin your assessment for each subject.</div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700">Search:</div>
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    placeholder="Search subject or subtopic..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-4"
                                />
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex flex-wrap justify-center lg:justify-start" style={{ gap: '20px' }}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center overflow-hidden w-full sm:w-64 md:w-72 lg:w-80 xl:w-64" style={{ height: '335px' }}>
                                        <div className="w-full h-32 bg-gray-200 rounded-t-xl border-b border-gray-200 flex items-center justify-center">
                                            <div className="w-full h-full bg-muted animate-pulse" />
                                        </div>
                                        <div className="w-full flex flex-col items-center px-4 py-4 flex-1">
                                            <div className="h-5 w-32 mb-2 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-full mb-3 bg-muted animate-pulse rounded" />
                                            <div className="space-y-2 w-full mb-3">
                                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                                <div className="flex gap-1">
                                                    <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                                                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                                                    <div className="h-5 w-10 bg-muted animate-pulse rounded" />
                                                </div>
                                            </div>
                                            <div className="w-full mt-auto">
                                                <div className="h-8 w-full bg-muted animate-pulse rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Subjects Grid */
                            <div className="flex flex-wrap justify-center lg:justify-start" style={{ gap: '20px' }}>
                                {filteredSubjects.map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center overflow-hidden w-full sm:w-64 md:w-72 lg:w-80 xl:w-64"
                                        style={{ height: '320px' }}
                                    >
                                        {/* Subject Image */}
                                        <div className="relative w-full h-32 bg-gray-100 rounded-t-xl border-b border-gray-200 flex items-center justify-center overflow-hidden">
                                            {subject.subject_picture_s3_url || subject.subject_picture ? (
                                                <S3Image
                                                    src={subject.subject_picture_s3_url && typeof subject.subject_picture_s3_url === 'string' && subject.subject_picture_s3_url.startsWith('https://') 
                                                        ? subject.subject_picture_s3_url 
                                                        : subject.subject_picture 
                                                            ? `/api/images/uploaded/${String(subject.subject_picture)}` 
                                                            : '/placeholder-subject.svg'}
                                                    alt={subject.name}
                                                    fill={true}
                                                    className="w-full h-full object-cover"
                                                    fallbackSrc="/placeholder-subject.svg"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-sm font-medium">
                                                    <div className="text-center">
                                                        <div className="text-2xl mb-1">📚</div>
                                                        <div className="text-xs">{subject.name}</div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Created Date Overlay */}
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="secondary" className="bg-white/90 text-gray-700 border-0 font-medium text-xs">
                                                    {formatDate(subject.created_at)}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="w-full flex flex-col items-center px-4 py-4 flex-1">
                                            <div className="text-base font-bold text-gray-900 text-center leading-tight mb-2 w-full">{subject.name}</div>

                                            {/* Subject Description */}
                                            <div className="text-xs text-gray-600 mb-3 w-full text-center line-clamp-2 flex-1">
                                                {subject.description || "No description available"}
                                            </div>

                                            {/* Difficulty Levels - Fixed at bottom */}
                                            <div className="w-full mb-3 mt-auto">
                                                <div className="text-xs font-medium text-gray-500 mb-1 text-center">Difficulty Levels:</div>
                                                <div className="flex gap-1 justify-center">
                                                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 cursor-pointer transition-colors text-xs px-2 py-0.5">
                                                        Easy
                                                    </Badge>
                                                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 cursor-pointer transition-colors text-xs px-2 py-0.5">
                                                        Medium
                                                    </Badge>
                                                    <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 cursor-pointer transition-colors text-xs px-2 py-0.5">
                                                        Hard
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Button at bottom */}
                                            <div className="w-full">
                                                <Button 
                                                    className="w-full h-8 bg-black text-white cursor-pointer text-sm"
                                                    onClick={() => handleSelectSubject(subject)}
                                                >
                                                    Select Subject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && filteredSubjects.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-muted-foreground">
                                    <p className="text-lg font-medium">No subjects found</p>
                                    <p className="text-sm">
                                        {searchTerm ? "Try adjusting your search terms" : "No exam subjects are available at the moment"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subject Details Dialog */}
                    <Dialog open={dialogOpen && !errorDialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[80vw] lg:w-[60vw] xl:w-[50vw]">
                            <DialogHeader>
                                <DialogTitle className="text-xl sm:text-2xl font-bold">Exam Details</DialogTitle>
                                <DialogDescription className="text-sm sm:text-base">
                                    Review the subject information and select your preferred difficulty level to begin the exam.
                                </DialogDescription>
                            </DialogHeader>

                            {selectedSubject && (
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Subject Information */}
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-name" className="text-sm font-medium">Subject Name</Label>
                                            <Input
                                                id="subject-name"
                                                value={selectedSubject.name}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-description" className="text-sm font-medium">Subject Description</Label>
                                            <Textarea
                                                id="subject-description"
                                                value={selectedSubject.description || "No description available"}
                                                readOnly
                                                className="bg-gray-50 min-h-[100px] resize-none"
                                            />
                                        </div>
                                    </div>


                                    {/* Difficulty Selection */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold">Select Difficulty Level</h3>
                                        <div className="space-y-2">
                                            <div 
                                                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    selectedDifficulty === "Easy" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                                                }`}
                                                onClick={() => setSelectedDifficulty("Easy")}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    selectedDifficulty === "Easy" ? "border-green-500 bg-green-500" : "border-gray-300"
                                                }`}>
                                                    {selectedDifficulty === "Easy" && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                                </div>
                                                <Label className="flex items-center gap-2 cursor-pointer">
                                                    <Badge className="bg-green-500 text-white">Easy</Badge>
                                                    <span className="text-sm text-gray-600">Basic level questions</span>
                                                </Label>
                                            </div>
                                            <div 
                                                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    selectedDifficulty === "Medium" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 hover:border-gray-300"
                                                }`}
                                                onClick={() => setSelectedDifficulty("Medium")}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    selectedDifficulty === "Medium" ? "border-yellow-500 bg-yellow-500" : "border-gray-300"
                                                }`}>
                                                    {selectedDifficulty === "Medium" && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                                </div>
                                                <Label className="flex items-center gap-2 cursor-pointer">
                                                    <Badge className="bg-yellow-500 text-white">Medium</Badge>
                                                    <span className="text-sm text-gray-600">Intermediate level questions</span>
                                                </Label>
                                            </div>
                                            <div 
                                                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    selectedDifficulty === "Hard" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                                                }`}
                                                onClick={() => setSelectedDifficulty("Hard")}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    selectedDifficulty === "Hard" ? "border-red-500 bg-red-500" : "border-gray-300"
                                                }`}>
                                                    {selectedDifficulty === "Hard" && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                                </div>
                                                <Label className="flex items-center gap-2 cursor-pointer">
                                                    <Badge className="bg-red-500 text-white">Hard</Badge>
                                                    <span className="text-sm text-gray-600">Advanced level questions</span>
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Information */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">⏰</span>
                                            <span className="font-semibold">
                                                Time: {selectedSubject.subject_time ? `${selectedSubject.subject_time} Hour${selectedSubject.subject_time !== 1 ? 's' : ''}` : 'Not specified'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {selectedSubject.subject_time 
                                                ? `You will have ${selectedSubject.subject_time} hour${selectedSubject.subject_time !== 1 ? 's' : ''} to complete the exam. Make sure you have a stable internet connection.`
                                                : 'Time limit not specified for this subject. Please contact your instructor.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleStartExam}
                                    disabled={!selectedDifficulty || generatingExam}
                                    className="bg-black hover:bg-gray-800"
                                >
                                    {generatingExam ? "Generating Exam..." : "Start Exam"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Error Dialog */}
                    <Dialog open={errorDialogOpen} onOpenChange={(open) => {
                        setErrorDialogOpen(open)
                        if (!open) {
                            setDialogOpen(false)
                        }
                    }}>
                        <DialogContent className="w-[90vw] max-w-sm sm:w-[80vw] md:w-[60vw] lg:w-[40vw] xl:w-[30vw]">
                            <DialogHeader>
                                <DialogTitle className="text-lg text-left sm:text-xl font-bold text-black mb-0 pb-0">Exam Not Available</DialogTitle>
                            </DialogHeader>
                            <div className="py-2 pt-0 mt-0">
                                <p className="text-xs sm:text-sm text-gray-600">
                                    {errorMessage}
                                </p>
                            </div>
                            <DialogFooter>
                                <Button 
                                    onClick={() => {
                                        setErrorDialogOpen(false)
                                        setDialogOpen(false)
                                    }}
                                    className="w-full bg-black cursor-pointer"
                                >
                                    Select Another Subject or Difficulty
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Exam Dialog */}
                    <ExamDialog
                        isOpen={examDialogOpen}
                        examData={examData}
                        subjectTime={selectedSubject?.subject_time}
                        onClose={() => {
                            setExamDialogOpen(false)
                            setExamData(null)
                        }}
                    />
                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
