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
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, FileSpreadsheet, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ImportQuestionsDialog } from "@/components/ui/import-questions-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Subject {
    id: string
    name: string
    description: string
    createdAt: Date
    subtopics: Subtopic[]
}

interface Subtopic {
    id: string
    name: string
    questionCount: number
    createdAt: Date
}

interface Question {
    id: string
    question: string
    questionText?: string
    questionImage?: string
    optionA: string
    optionAText?: string
    optionAImage?: string
    optionB: string
    optionBText?: string
    optionBImage?: string
    optionC: string
    optionCText?: string
    optionCImage?: string
    optionD: string
    optionDText?: string
    optionDImage?: string
    correctAnswer: string
    explanation?: string
    difficultyLevel?: string
    createdAt: Date
    subjectId?: string
    subtopicId?: string
    subjectName?: string
    subtopicName?: string
}


export default function SuperAdminExamQuestionBank() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedSubject, setSelectedSubject] = useState("all")
    const [selectedSubtopic, setSelectedSubtopic] = useState("all")
    const [selectedDifficulty, setSelectedDifficulty] = useState("all")
    const [subtopics, setSubtopics] = useState<Subtopic[]>([])
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [questionsLoading, setQuestionsLoading] = useState(false)

    // Add Question Dialog states
    const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false)
    const [dialogSelectedSubject, setDialogSelectedSubject] = useState("")
    const [dialogSelectedSubtopic, setDialogSelectedSubtopic] = useState("")
    const [dialogSubtopics, setDialogSubtopics] = useState<Subtopic[]>([])
    const [questionText, setQuestionText] = useState("")
    const [questionImageName, setQuestionImageName] = useState<string | null>(null)
    const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
    const [optionA, setOptionA] = useState("")
    const [optionB, setOptionB] = useState("")
    const [optionC, setOptionC] = useState("")
    const [optionD, setOptionD] = useState("")
    const [optionAImageName, setOptionAImageName] = useState<string | null>(null)
    const [optionAImageFile, setOptionAImageFile] = useState<File | null>(null)
    const [optionBImageName, setOptionBImageName] = useState<string | null>(null)
    const [optionBImageFile, setOptionBImageFile] = useState<File | null>(null)
    const [optionCImageName, setOptionCImageName] = useState<string | null>(null)
    const [optionCImageFile, setOptionCImageFile] = useState<File | null>(null)
    const [optionDImageName, setOptionDImageName] = useState<string | null>(null)
    const [optionDImageFile, setOptionDImageFile] = useState<File | null>(null)

    const [correctAnswer, setCorrectAnswer] = useState("")
    const [explanation, setExplanation] = useState("")
    const [difficulty, setDifficulty] = useState("")
    const [saving, setSaving] = useState(false)

    // Edit functionality states
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
    const [editQuestionText, setEditQuestionText] = useState("")
    const [editQuestionImageName, setEditQuestionImageName] = useState<string | null>(null)
    const [editQuestionImageFile, setEditQuestionImageFile] = useState<File | null>(null)
    const [editOptionA, setEditOptionA] = useState("")
    const [editOptionAImageName, setEditOptionAImageName] = useState<string | null>(null)
    const [editOptionAImageFile, setEditOptionAImageFile] = useState<File | null>(null)
    const [editOptionB, setEditOptionB] = useState("")
    const [editOptionBImageName, setEditOptionBImageName] = useState<string | null>(null)
    const [editOptionBImageFile, setEditOptionBImageFile] = useState<File | null>(null)
    const [editOptionC, setEditOptionC] = useState("")
    const [editOptionCImageName, setEditOptionCImageName] = useState<string | null>(null)
    const [editOptionCImageFile, setEditOptionCImageFile] = useState<File | null>(null)
    const [editOptionD, setEditOptionD] = useState("")
    const [editOptionDImageName, setEditOptionDImageName] = useState<string | null>(null)
    const [editOptionDImageFile, setEditOptionDImageFile] = useState<File | null>(null)
    const [editCorrectAnswer, setEditCorrectAnswer] = useState("")
    const [editExplanation, setEditExplanation] = useState("")
    const [editDifficulty, setEditDifficulty] = useState("")
    const [updating, setUpdating] = useState(false)

    // Delete functionality states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Bulk delete functionality states
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [bulkDeleting, setBulkDeleting] = useState(false)

    // Import functionality state
    const [importDialogOpen, setImportDialogOpen] = useState(false)

    // Fetch subjects on component mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch('/api/subjects')
                if (response.ok) {
                    const result = await response.json()
                    const data = result.data || result // Handle both wrapped and unwrapped responses
                    // Convert date strings to Date objects
                    const subjectsWithDates = data.map((subject: { id: number; name: string; description?: string; picture?: string; subtopics: Array<{ id: number; name: string; subject_id: number; created_at: string }>; created_at: string }) => ({
                        ...subject,
                        createdAt: new Date(subject.created_at),
                        subtopics: subject.subtopics.map((subtopic: { id: number; name: string; subject_id: number; created_at: string }) => ({
                            ...subtopic,
                            createdAt: new Date(subtopic.created_at)
                        }))
                    }))
                    setSubjects(subjectsWithDates)
                }
            } catch (error) {
                console.error('Error fetching subjects:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubjects()
    }, [])

    // Fetch subtopics when subject changes
    useEffect(() => {
        if (selectedSubject && selectedSubject !== 'all') {
            const fetchSubtopics = async () => {
                try {
                    const response = await fetch(`/api/subjects/${selectedSubject}/subtopics`)
                    if (response.ok) {
                        const result = await response.json()
                        const data = result.data || result // Handle both wrapped and unwrapped responses
                        // Convert date strings to Date objects
                        const subtopicsWithDates = data.map((subtopic: { id: number; name: string; subject_id: number; created_at: string }) => ({
                            ...subtopic,
                            createdAt: new Date(subtopic.created_at)
                        }))
                        setSubtopics(subtopicsWithDates)
                    }
                } catch (error) {
                    console.error('Error fetching subtopics:', error)
                }
            }

            fetchSubtopics()
            setSelectedSubtopic("") // Reset to "Select a subtopic" when specific subject is selected
        } else if (selectedSubject === 'all') {
            // If "All" is selected, clear subtopics and set to "All Subtopics"
            setSubtopics([])
            setSelectedSubtopic("all") // Keep "All Subtopics" selected when "All Subjects" is selected
        } else {
            setSubtopics([])
            setSelectedSubtopic("all")
        }
    }, [selectedSubject, subjects])

    // Function to fetch questions
    const fetchQuestions = useCallback(async () => {
        setQuestionsLoading(true)
        try {
            let url = '/api/questions'

            // Build query parameters based on selections
            if (selectedSubject === 'all' && selectedSubtopic === 'all') {
                // Show all questions from all subjects and subtopics
                url = '/api/questions'
            } else if (selectedSubject === 'all' && selectedSubtopic !== 'all') {
                // Show questions from specific subtopic across all subjects
                url += `?subtopic_id=${selectedSubtopic}`
            } else if (selectedSubject !== 'all' && selectedSubtopic) {
                // Show questions from specific subtopic
                url += `?subtopic_id=${selectedSubtopic}`
            } else {
                // No questions to show (specific subject selected but no subtopic)
                setQuestions([])
                setQuestionsLoading(false)
                return
            }

            const response = await fetch(url)
            if (response.ok) {
                const result = await response.json()
                const data = result.data || result

                // Transform API data to match our Question interface
                const transformedQuestions: Question[] = data.map((q: { id: string; subtopic_id: string; question_text: string; question_image?: string; option_a_text: string; option_a_image?: string; option_b_text: string; option_b_image?: string; option_c_text: string; option_c_image?: string; option_d_text: string; option_d_image?: string; correct_answer: string; explanation?: string; difficulty_level: string; points: number; created_at: string; subtopic_name: string; subject_id: string; subject_name: string }) => ({
                    id: q.id,
                    question: q.question_text || '',
                    questionText: q.question_text,
                    questionImage: q.question_image,
                    optionA: q.option_a_text || '',
                    optionAText: q.option_a_text,
                    optionAImage: q.option_a_image,
                    optionB: q.option_b_text || '',
                    optionBText: q.option_b_text,
                    optionBImage: q.option_b_image,
                    optionC: q.option_c_text || '',
                    optionCText: q.option_c_text,
                    optionCImage: q.option_c_image,
                    optionD: q.option_d_text || '',
                    optionDText: q.option_d_text,
                    optionDImage: q.option_d_image,
                    correctAnswer: q.correct_answer,
                    explanation: q.explanation,
                    difficultyLevel: q.difficulty_level,
                    createdAt: new Date(q.created_at),
                    subjectId: q.subject_id,
                    subtopicId: q.subtopic_id,
                    subjectName: q.subject_name,
                    subtopicName: q.subtopic_name
                }))

                // Filter by difficulty if not "all"
                let filteredQuestions = transformedQuestions
                if (selectedDifficulty !== 'all') {
                    console.log('Filtering by difficulty:', selectedDifficulty)
                    console.log('Available difficulties in questions:', [...new Set(transformedQuestions.map(q => q.difficultyLevel))])
                    filteredQuestions = transformedQuestions.filter(q =>
                        q.difficultyLevel && q.difficultyLevel.toLowerCase() === selectedDifficulty.toLowerCase()
                    )
                    console.log('Filtered questions count:', filteredQuestions.length)
                }

                setQuestions(filteredQuestions)
            } else {
                // No questions found - set empty array
                setQuestions([])
            }
        } catch (error) {
            console.error('Error fetching questions:', error)
            setQuestions([])
        } finally {
            setQuestionsLoading(false)
        }
    }, [selectedSubject, selectedSubtopic, selectedDifficulty])

    // Fetch questions when filters change
    useEffect(() => {
        if (selectedSubject === 'all' || (selectedSubject && selectedSubtopic)) {
            fetchQuestions()
        } else {
            setQuestions([])
        }
    }, [selectedSubject, selectedSubtopic, selectedDifficulty, fetchQuestions])

    // Clear selected questions when filters change
    useEffect(() => {
        setSelectedQuestions(new Set())
    }, [selectedSubject, selectedSubtopic, selectedDifficulty])

    // Fetch subtopics for dialog when subject changes
    useEffect(() => {
        if (dialogSelectedSubject) {
            const fetchDialogSubtopics = async () => {
                try {
                    const response = await fetch(`/api/subjects/${dialogSelectedSubject}/subtopics`)
                    if (response.ok) {
                        const result = await response.json()
                        const data = result.data || result
                        const subtopicsWithDates = data.map((subtopic: { id: number; name: string; subject_id: number; created_at: string }) => ({
                            ...subtopic,
                            createdAt: new Date(subtopic.created_at)
                        }))
                        setDialogSubtopics(subtopicsWithDates)
                    }
                } catch (error) {
                    console.error('Error fetching dialog subtopics:', error)
                }
            }

            fetchDialogSubtopics()
            setDialogSelectedSubtopic("") // Reset subtopic selection
        } else {
            setDialogSubtopics([])
            setDialogSelectedSubtopic("")
        }
    }, [dialogSelectedSubject])

    // Fetch subtopics for edit dialog when subject changes
    useEffect(() => {
        if (editingQuestion?.subjectId) {
            const fetchEditDialogSubtopics = async () => {
                try {
                    const response = await fetch(`/api/subjects/${editingQuestion.subjectId}/subtopics`)
                    if (response.ok) {
                        const result = await response.json()
                        const data = result.data || result
                        const subtopicsWithDates = data.map((subtopic: { id: number; name: string; subject_id: number; created_at: string }) => ({
                            ...subtopic,
                            createdAt: new Date(subtopic.created_at)
                        }))
                        setDialogSubtopics(subtopicsWithDates)
                    }
                } catch (error) {
                    console.error('Error fetching edit dialog subtopics:', error)
                }
            }

            fetchEditDialogSubtopics()
            setDialogSelectedSubtopic("") // Reset subtopic selection
        } else {
            setDialogSubtopics([])
            setDialogSelectedSubtopic("")
        }
    }, [editingQuestion?.subjectId])



    // Form handlers
    const handleFileChange = (setter: (file: File | null) => void, fileNameSetter?: (fileName: string | null) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        if (file) {
            try {
                // Upload file to server
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (response.ok) {
                    const result = await response.json()
                    setter(file)
                    if (fileNameSetter) {
                        fileNameSetter(result.imageId)
                    }
                } else {
                    const error = await response.json()
                    alert(`Upload failed: ${error.error}`)
                    // Reset the input
                    e.target.value = ''
                }
            } catch (error) {
                console.error('Upload error:', error)
                alert('Failed to upload file')
                // Reset the input
                e.target.value = ''
            }
        } else {
            setter(null)
            if (fileNameSetter) {
                fileNameSetter(null)
            }
        }
    }

    const resetForm = () => {
        setDialogSelectedSubject("")
        setDialogSelectedSubtopic("")
        setQuestionText("")
        setQuestionImageName(null)
        setQuestionImageFile(null)
        setOptionA("")
        setOptionB("")
        setOptionC("")
        setOptionD("")
        setOptionAImageName(null)
        setOptionAImageFile(null)
        setOptionBImageName(null)
        setOptionBImageFile(null)
        setOptionCImageName(null)
        setOptionCImageFile(null)
        setOptionDImageName(null)
        setOptionDImageFile(null)
        setCorrectAnswer("")
        setExplanation("")
        setDifficulty("")
    }

    const resetEditForm = () => {
        setEditQuestionText("")
        setEditQuestionImageName(null)
        setEditQuestionImageFile(null)
        setEditOptionA("")
        setEditOptionAImageName(null)
        setEditOptionAImageFile(null)
        setEditOptionB("")
        setEditOptionBImageName(null)
        setEditOptionBImageFile(null)
        setEditOptionC("")
        setEditOptionCImageName(null)
        setEditOptionCImageFile(null)
        setEditOptionD("")
        setEditOptionDImageName(null)
        setEditOptionDImageFile(null)
        setEditCorrectAnswer("")
        setEditExplanation("")
        setEditDifficulty("")
        setEditingQuestion(null)
    }

    // Functions to remove images for add question dialog
    const removeAddQuestionImage = () => {
        setQuestionImageName(null)
        setQuestionImageFile(null)
    }

    const removeAddOptionAImage = () => {
        setOptionAImageName(null)
        setOptionAImageFile(null)
    }

    const removeAddOptionBImage = () => {
        setOptionBImageName(null)
        setOptionBImageFile(null)
    }

    const removeAddOptionCImage = () => {
        setOptionCImageName(null)
        setOptionCImageFile(null)
    }

    const removeAddOptionDImage = () => {
        setOptionDImageName(null)
        setOptionDImageFile(null)
    }

    // Functions to remove images for edit dialog
    const removeQuestionImage = () => {
        setEditQuestionImageName(null)
        setEditQuestionImageFile(null)
    }

    const removeOptionAImage = () => {
        setEditOptionAImageName(null)
        setEditOptionAImageFile(null)
    }

    const removeOptionBImage = () => {
        setEditOptionBImageName(null)
        setEditOptionBImageFile(null)
    }

    const removeOptionCImage = () => {
        setEditOptionCImageName(null)
        setEditOptionCImageFile(null)
    }

    const removeOptionDImage = () => {
        setEditOptionDImageName(null)
        setEditOptionDImageFile(null)
    }

    // Handle edit question
    const handleEditQuestion = (question: Question) => {
        console.log('Editing question:', question)
        console.log('Question subjectId:', question.subjectId)
        console.log('Question subtopicId:', question.subtopicId)
        setEditingQuestion(question)
        setEditQuestionText(question.questionText || "")
        setEditQuestionImageName(question.questionImage || null)
        setEditQuestionImageFile(null) // Reset file state
        setEditOptionA(question.optionAText || "")
        setEditOptionAImageName(question.optionAImage || null)
        setEditOptionAImageFile(null) // Reset file state
        setEditOptionB(question.optionBText || "")
        setEditOptionBImageName(question.optionBImage || null)
        setEditOptionBImageFile(null) // Reset file state
        setEditOptionC(question.optionCText || "")
        setEditOptionCImageName(question.optionCImage || null)
        setEditOptionCImageFile(null) // Reset file state
        setEditOptionD(question.optionDText || "")
        setEditOptionDImageName(question.optionDImage || null)
        setEditOptionDImageFile(null) // Reset file state
        setEditCorrectAnswer(question.correctAnswer || "")
        setEditExplanation(question.explanation || "")
        setEditDifficulty(question.difficultyLevel || "")

        setEditDialogOpen(true)
    }

    // Handle update question
    const handleUpdateQuestion = async () => {
        if (!editingQuestion) return

        // Validate required fields - use existing subject and subtopic IDs
        if (!editingQuestion.subjectId || !editingQuestion.subtopicId) {
            alert("Question is missing subject or subtopic information")
            return
        }

        if (!editCorrectAnswer) {
            alert("Please select the correct answer")
            return
        }

        // Check if question has either text or image (including existing images)
        const hasQuestionImage = editQuestionImageName || editQuestionImageFile
        if ((!editQuestionText || editQuestionText.trim() === "") && !hasQuestionImage) {
            alert("Please provide either question text or question image")
            return
        }

        // Check if all options have either text or image (including existing images)
        const missingOptions = []
        const hasOptionAImage = editOptionAImageName || editOptionAImageFile
        const hasOptionBImage = editOptionBImageName || editOptionBImageFile
        const hasOptionCImage = editOptionCImageName || editOptionCImageFile
        const hasOptionDImage = editOptionDImageName || editOptionDImageFile

        if ((!editOptionA || editOptionA.trim() === "") && !hasOptionAImage) missingOptions.push('Option A')
        if ((!editOptionB || editOptionB.trim() === "") && !hasOptionBImage) missingOptions.push('Option B')
        if ((!editOptionC || editOptionC.trim() === "") && !hasOptionCImage) missingOptions.push('Option C')
        if ((!editOptionD || editOptionD.trim() === "") && !hasOptionDImage) missingOptions.push('Option D')

        if (missingOptions.length > 0) {
            alert(`Please provide either text or image for: ${missingOptions.join(', ')}`)
            return
        }

        setUpdating(true)
        try {
            const questionData = {
                subtopicId: editingQuestion.subtopicId, // Use existing subtopic ID
                questionText: editQuestionText,
                questionImage: editQuestionImageName || null,
                optionAText: editOptionA,
                optionAImage: editOptionAImageName || null,
                optionBText: editOptionB,
                optionBImage: editOptionBImageName || null,
                optionCText: editOptionC,
                optionCImage: editOptionCImageName || null,
                optionDText: editOptionD,
                optionDImage: editOptionDImageName || null,
                correctAnswer: editCorrectAnswer,
                explanation: editExplanation || null,
                difficultyLevel: editDifficulty || 'medium'
            }

            const response = await fetch(`/api/questions/${editingQuestion.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(questionData)
            })

            if (response.ok) {
                alert("Question updated successfully!")
                setEditDialogOpen(false)
                resetEditForm()
                window.location.reload()
            } else {
                const errorData = await response.json()
                alert(`Failed to update question: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error updating question:', error)
            alert("Failed to update question")
        } finally {
            setUpdating(false)
        }
    }

    // Handle delete question
    const handleDeleteQuestion = (question: Question) => {
        setDeletingQuestion(question)
        setDeleteDialogOpen(true)
    }

    const confirmDeleteQuestion = async () => {
        if (!deletingQuestion) return

        setDeleting(true)
        try {
            const response = await fetch(`/api/questions/${deletingQuestion.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                alert("Question deleted successfully!")
                setDeleteDialogOpen(false)
                setDeletingQuestion(null)
                // Refresh questions list
                fetchQuestions()
            } else {
                const errorData = await response.json()
                alert(`Failed to delete question: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error deleting question:', error)
            alert("Failed to delete question")
        } finally {
            setDeleting(false)
        }
    }

    // Bulk delete functionality
    const handleSelectAll = () => {
        if (selectedQuestions.size === questions.length) {
            // If all are selected, deselect all
            setSelectedQuestions(new Set())
        } else {
            // Select all questions
            setSelectedQuestions(new Set(questions.map(q => q.id)))
        }
    }

    const handleSelectQuestion = (questionId: string) => {
        const newSelected = new Set(selectedQuestions)
        if (newSelected.has(questionId)) {
            newSelected.delete(questionId)
        } else {
            newSelected.add(questionId)
        }
        setSelectedQuestions(newSelected)
    }

    const handleBulkDelete = () => {
        if (selectedQuestions.size === 0) return
        setBulkDeleteDialogOpen(true)
    }

    const confirmBulkDelete = async () => {
        if (selectedQuestions.size === 0) return

        setBulkDeleting(true)
        try {
            const deletePromises = Array.from(selectedQuestions).map(questionId =>
                fetch(`/api/questions/${questionId}`, {
                    method: 'DELETE'
                })
            )

            const results = await Promise.allSettled(deletePromises)

            let successCount = 0
            let failCount = 0

            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value.ok) {
                    successCount++
                } else {
                    failCount++
                }
            })

            if (successCount > 0) {
                alert(`Successfully deleted ${successCount} question(s)${failCount > 0 ? `. Failed to delete ${failCount} question(s).` : '.'}`)
                setBulkDeleteDialogOpen(false)
                setSelectedQuestions(new Set())
                // Refresh questions list
                fetchQuestions()
            } else {
                alert(`Failed to delete all ${selectedQuestions.size} question(s).`)
            }
        } catch (error) {
            console.error('Error bulk deleting questions:', error)
            alert("Failed to delete questions")
        } finally {
            setBulkDeleting(false)
        }
    }

    const handleSaveQuestion = async () => {
        // Debug: Log current values
        console.log('Validation check:', {
            dialogSelectedSubject,
            dialogSelectedSubtopic,
            correctAnswer,
            questionText,
            questionImageName,
            optionA,
            optionAImageName,
            optionB,
            optionBImageName,
            optionC,
            optionCImageName,
            optionD,
            optionDImageName
        })

        if (!dialogSelectedSubject || !dialogSelectedSubtopic || !correctAnswer) {
            const missing = []
            if (!dialogSelectedSubject) missing.push('Subject')
            if (!dialogSelectedSubtopic) missing.push('Subtopic')
            if (!correctAnswer) missing.push('Correct Answer')
            alert(`Please fill in: ${missing.join(', ')}`)
            return
        }

        // Check if question has either text or image (including file uploads)
        const hasQuestionImage = questionImageName || questionImageFile
        if ((!questionText || questionText.trim() === "") && !hasQuestionImage) {
            alert("Please provide either question text or question image")
            return
        }

        // Check if all options have either text or image (including file uploads)
        const missingOptions = []
        const hasOptionAImage = optionAImageName || optionAImageFile
        const hasOptionBImage = optionBImageName || optionBImageFile
        const hasOptionCImage = optionCImageName || optionCImageFile
        const hasOptionDImage = optionDImageName || optionDImageFile

        if ((!optionA || optionA.trim() === "") && !hasOptionAImage) missingOptions.push('Option A')
        if ((!optionB || optionB.trim() === "") && !hasOptionBImage) missingOptions.push('Option B')
        if ((!optionC || optionC.trim() === "") && !hasOptionCImage) missingOptions.push('Option C')
        if ((!optionD || optionD.trim() === "") && !hasOptionDImage) missingOptions.push('Option D')

        if (missingOptions.length > 0) {
            alert(`Please provide either text or image for: ${missingOptions.join(', ')}`)
            return
        }

        setSaving(true)
        try {
            const questionData = {
                subtopicId: dialogSelectedSubtopic,
                questionText,
                questionImage: questionImageName || null,
                optionAText: optionA,
                optionAImage: optionAImageName || null,
                optionBText: optionB,
                optionBImage: optionBImageName || null,
                optionCText: optionC,
                optionCImage: optionCImageName || null,
                optionDText: optionD,
                optionDImage: optionDImageName || null,
                correctAnswer,
                explanation: explanation || null,
                difficultyLevel: difficulty || 'medium'
            }

            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(questionData)
            })

            if (response.ok) {
                setAddQuestionDialogOpen(false)
                resetForm()
                alert("Question saved successfully!")
                window.location.reload()
            } else {
                const errorData = await response.json()
                alert(`Error saving question: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error saving question:', error)
            alert("Error saving question")
        } finally {
            setSaving(false)
        }
    }

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
                                        <BreadcrumbLink href="/instructor">
                                            Dashboard
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Exam Question Bank</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    {/* Add Exam Questions Button - First */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-0 pl-6 pr-6">
                        <Dialog open={addQuestionDialogOpen} onOpenChange={setAddQuestionDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-600 cursor-pointer hover:bg-green-800 text-primary-foreground w-full sm:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Exam Questions</span>
                                    <span className="sm:hidden">Add Question</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className="max-h-[90vh] overflow-y-auto w-[95vw] md:w-[50vw] md:max-w-[50vw] min-w-[320px] mx-2 sm:mx-4"
                            >
                                <DialogHeader className="pt-0 mt-0">
                                    <DialogTitle className="flex items-center space-x-2">
                                        <Plus className="h-5 w-5" />
                                        <span>Add New Exam Question</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create a new exam question with multiple choice answers and optional images.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {/* Subject and Subtopic Selection */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-2 pt-0 mt-0">
                                            <Label htmlFor="dialog-subject">Subject</Label>
                                            <select
                                                id="dialog-subject"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={dialogSelectedSubject}
                                                onChange={(e) => setDialogSelectedSubject(e.target.value)}
                                            >
                                                <option value="">Select a subject</option>
                                                {subjects.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="dialog-subtopic">Subtopic</Label>
                                            <select
                                                id="dialog-subtopic"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={dialogSelectedSubtopic}
                                                onChange={(e) => setDialogSelectedSubtopic(e.target.value)}
                                                disabled={!dialogSelectedSubject || dialogSubtopics.length === 0}
                                            >
                                                <option value="">Select a subtopic</option>
                                                {dialogSubtopics.map((subtopic) => (
                                                    <option key={subtopic.id} value={subtopic.id}>
                                                        {subtopic.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Question */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-normal">Question (You can either use text or image)</Label>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="question-text">Text</Label>
                                                <Textarea
                                                    id="question-text"
                                                    placeholder="Enter your question here..."
                                                    value={questionText}
                                                    onChange={(e) => setQuestionText(e.target.value)}
                                                    rows={2}
                                                    className="resize-none"
                                                />
                                            </div>

                                            {/* Image Upload */}
                                            <div className="space-y-2">
                                                <Label htmlFor="question-image">Image (Optional)</Label>
                                                <Input
                                                    id="question-image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange(setQuestionImageFile, setQuestionImageName)}
                                                    className="cursor-pointer"
                                                />
                                                {questionImageFile && (
                                                    <div className="text-sm text-green-600 flex items-center gap-2">
                                                        ✓ Image selected: {questionImageFile.name}
                                                        <button
                                                            type="button"
                                                            onClick={removeAddQuestionImage}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer Options */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-normal">Answer Options (You can either use text or image)</Label>
                                        <div className="space-y-4">

                                            {/* Option A */}
                                            <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                                <Label className="font-medium text-base">A.</Label>
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-a-text">Text</Label>
                                                        <Textarea
                                                            id="option-a-text"
                                                            placeholder="Option A text..."
                                                            value={optionA}
                                                            onChange={(e) => setOptionA(e.target.value)}
                                                            rows={2}
                                                            className="resize-none"
                                                        />
                                                    </div>

                                                    {/* Image Upload */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-a-image">Image (Optional)</Label>
                                                        <Input
                                                            id="option-a-image"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange(setOptionAImageFile, setOptionAImageName)}
                                                            className="text-sm"
                                                        />
                                                        {optionAImageFile && (
                                                            <div className="text-sm text-green-600 flex items-center gap-2">
                                                                ✓ Image selected: {optionAImageFile.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={removeAddOptionAImage}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Option B */}
                                            <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                                <Label className="font-medium text-base">B.</Label>
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-b-text">Text</Label>
                                                        <Textarea
                                                            id="option-b-text"
                                                            placeholder="Option B text..."
                                                            value={optionB}
                                                            onChange={(e) => setOptionB(e.target.value)}
                                                            rows={2}
                                                            className="resize-none"
                                                        />
                                                    </div>

                                                    {/* Image Upload */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-b-image">Image (Optional)</Label>
                                                        <Input
                                                            id="option-b-image"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange(setOptionBImageFile, setOptionBImageName)}
                                                            className="text-sm"
                                                        />
                                                        {optionBImageFile && (
                                                            <div className="text-sm text-green-600 flex items-center gap-2">
                                                                ✓ Image selected: {optionBImageFile.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={removeAddOptionBImage}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Option C */}
                                            <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                                <Label className="font-medium text-base">C.</Label>
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-c-text">Text</Label>
                                                        <Textarea
                                                            id="option-c-text"
                                                            placeholder="Option C text..."
                                                            value={optionC}
                                                            onChange={(e) => setOptionC(e.target.value)}
                                                            rows={2}
                                                            className="resize-none"
                                                        />
                                                    </div>

                                                    {/* Image Upload */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-c-image">Image (Optional)</Label>
                                                        <Input
                                                            id="option-c-image"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange(setOptionCImageFile, setOptionCImageName)}
                                                            className="text-sm"
                                                        />
                                                        {optionCImageFile && (
                                                            <div className="text-sm text-green-600 flex items-center gap-2">
                                                                ✓ Image selected: {optionCImageFile.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={removeAddOptionCImage}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Option D */}
                                            <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                                <Label className="font-medium text-base">D.</Label>
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-d-text">Text</Label>
                                                        <Textarea
                                                            id="option-d-text"
                                                            placeholder="Option D text..."
                                                            value={optionD}
                                                            onChange={(e) => setOptionD(e.target.value)}
                                                            rows={2}
                                                            className="resize-none"
                                                        />
                                                    </div>

                                                    {/* Image Upload */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="option-d-image">Image (Optional)</Label>
                                                        <Input
                                                            id="option-d-image"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange(setOptionDImageFile, setOptionDImageName)}
                                                            className="text-sm"
                                                        />
                                                        {optionDImageFile && (
                                                            <div className="text-sm text-green-600 flex items-center gap-2">
                                                                ✓ Image selected: {optionDImageFile.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={removeAddOptionDImage}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Difficulty Level */}
                                    <div className="space-y-2">
                                        <Label htmlFor="difficulty">Difficulty Level</Label>
                                        <select
                                            id="difficulty"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select difficulty level</option>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    {/* Correct Answer Selection */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Correct Answer</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="correct-A"
                                                    name="correctAnswer"
                                                    value="A"
                                                    checked={correctAnswer === "A"}
                                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                                />
                                                <Label htmlFor="correct-A" className="text-sm font-medium">A</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="correct-B"
                                                    name="correctAnswer"
                                                    value="B"
                                                    checked={correctAnswer === "B"}
                                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                                />
                                                <Label htmlFor="correct-B" className="text-sm font-medium">B</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="correct-C"
                                                    name="correctAnswer"
                                                    value="C"
                                                    checked={correctAnswer === "C"}
                                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                                />
                                                <Label htmlFor="correct-C" className="text-sm font-medium">C</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="correct-D"
                                                    name="correctAnswer"
                                                    value="D"
                                                    checked={correctAnswer === "D"}
                                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                                />
                                                <Label htmlFor="correct-D" className="text-sm font-medium">D</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="space-y-2">
                                        <Label htmlFor="explanation">Explanation</Label>
                                        <Textarea
                                            id="explanation"
                                            placeholder="Explain why this is the correct answer..."
                                            value={explanation}
                                            onChange={(e) => setExplanation(e.target.value)}
                                            rows={2}
                                            className="resize-none"
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                        setAddQuestionDialogOpen(false)
                                        resetForm()
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveQuestion}
                                        disabled={saving || !dialogSelectedSubject || !dialogSelectedSubtopic || ((!questionText || questionText.trim() === "") && !questionImageName && !questionImageFile) || !correctAnswer || ((!optionA || optionA.trim() === "") && !optionAImageName && !optionAImageFile) || ((!optionB || optionB.trim() === "") && !optionBImageName && !optionBImageFile) || ((!optionC || optionC.trim() === "") && !optionCImageName && !optionCImageFile) || ((!optionD || optionD.trim() === "") && !optionDImageName && !optionDImageFile)}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Question"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Import CSV/Excel Button */}
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => setImportDialogOpen(true)}
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Import CSV/Excel Questions</span>
                            <span className="sm:hidden">Import Questions</span>
                        </Button>
                    </div>

                    {/* Import Questions Dialog Component */}
                    <ImportQuestionsDialog
                        open={importDialogOpen}
                        onOpenChange={setImportDialogOpen}
                        onImportComplete={fetchQuestions}
                    />

                    {/* Edit Question Dialog */}
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent
                            className="space-y-4 py-4 gap-4 max-h-[90vh] overflow-y-auto w-[95vw] md:w-[50vw] md:max-w-[50vw] min-w-[320px] mx-2 sm:mx-4"
                        >
                            <DialogHeader className="pt-0 mt-0">
                                <DialogTitle className="flex items-center space-x-2">
                                    <Edit className="h-5 w-5" />
                                    <span>Edit Question</span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Current Subject and Subtopic Display */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-2">Current Subject & Subtopic:</div>
                                    <div className="flex gap-4">
                                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                            {editingQuestion?.subjectName || 'Unknown Subject'}
                                        </div>
                                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                            {editingQuestion?.subtopicName || 'Unknown Subtopic'}
                                        </div>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="space-y-4">
                                    <Label className="text-sm font-normal">Question (You can either use text or image)</Label>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-question-text">Text</Label>
                                            <Textarea
                                                id="edit-question-text"
                                                placeholder="Enter your question here..."
                                                value={editQuestionText}
                                                onChange={(e) => setEditQuestionText(e.target.value)}
                                                rows={2}
                                                className="resize-none"
                                            />
                                        </div>

                                        {/* Current Image Display */}
                                        {editQuestionImageName && !editQuestionImageFile && (
                                            <div className="space-y-2">
                                                <Label>Current Image</Label>
                                                <div className="relative inline-block">
                                                    <Image
                                                        src={editQuestionImageName && typeof editQuestionImageName === 'string' && editQuestionImageName.startsWith('https://')
                                                            ? editQuestionImageName
                                                            : `/api/images/uploaded/${String(editQuestionImageName)}`}
                                                        alt="Current question image"
                                                        width={200}
                                                        height={150}
                                                        className="rounded-lg border border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={removeQuestionImage}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* New Image Upload */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-question-image">
                                                {editQuestionImageName && !editQuestionImageFile ? 'Replace Image' : 'Image (Optional)'}
                                            </Label>
                                            <Input
                                                id="edit-question-image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange(setEditQuestionImageFile, setEditQuestionImageName)}
                                                className="cursor-pointer"
                                            />
                                            {editQuestionImageFile && (
                                                <div className="text-sm text-green-600 flex items-center gap-2">
                                                    ✓ New image selected: {editQuestionImageFile.name}
                                                    <button
                                                        type="button"
                                                        onClick={removeQuestionImage}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Answer Options */}
                                <div className="space-y-4">
                                    <Label className="text-sm font-normal">Answer Options (You can either use text or image)</Label>
                                    <div className="space-y-4">

                                        {/* Option A */}
                                        <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                            <Label className="font-medium text-base">A.</Label>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-a-text">Text</Label>
                                                    <Textarea
                                                        id="edit-option-a-text"
                                                        placeholder="Option A text..."
                                                        value={editOptionA}
                                                        onChange={(e) => setEditOptionA(e.target.value)}
                                                        rows={2}
                                                        className="resize-none"
                                                    />
                                                </div>

                                                {/* Current Image Display */}
                                                {editOptionAImageName && !editOptionAImageFile && (
                                                    <div className="space-y-2">
                                                        <Label>Current Image</Label>
                                                        <div className="relative inline-block">
                                                            <Image
                                                                src={editOptionAImageName && typeof editOptionAImageName === 'string' && editOptionAImageName.startsWith('https://')
                                                                    ? editOptionAImageName
                                                                    : `/api/images/uploaded/${String(editOptionAImageName)}`}
                                                                alt="Current option A image"
                                                                width={150}
                                                                height={100}
                                                                className="rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionAImage}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* New Image Upload */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-a-image">
                                                        {editOptionAImageName && !editOptionAImageFile ? 'Replace Image' : 'Image (Optional)'}
                                                    </Label>
                                                    <Input
                                                        id="edit-option-a-image"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange(setEditOptionAImageFile, setEditOptionAImageName)}
                                                        className="text-sm"
                                                    />
                                                    {editOptionAImageFile && (
                                                        <div className="text-sm text-green-600 flex items-center gap-2">
                                                            ✓ New image selected: {editOptionAImageFile.name}
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionAImage}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option B */}
                                        <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                            <Label className="font-medium text-base">B.</Label>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-b-text">Text</Label>
                                                    <Textarea
                                                        id="edit-option-b-text"
                                                        placeholder="Option B text..."
                                                        value={editOptionB}
                                                        onChange={(e) => setEditOptionB(e.target.value)}
                                                        rows={2}
                                                        className="resize-none"
                                                    />
                                                </div>

                                                {/* Current Image Display */}
                                                {editOptionBImageName && !editOptionBImageFile && (
                                                    <div className="space-y-2">
                                                        <Label>Current Image</Label>
                                                        <div className="relative inline-block">
                                                            <Image
                                                                src={editOptionBImageName && typeof editOptionBImageName === 'string' && editOptionBImageName.startsWith('https://')
                                                                    ? editOptionBImageName
                                                                    : `/api/images/uploaded/${String(editOptionBImageName)}`}
                                                                alt="Current option B image"
                                                                width={150}
                                                                height={100}
                                                                className="rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionBImage}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* New Image Upload */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-b-image">
                                                        {editOptionBImageName && !editOptionBImageFile ? 'Replace Image' : 'Image (Optional)'}
                                                    </Label>
                                                    <Input
                                                        id="edit-option-b-image"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange(setEditOptionBImageFile, setEditOptionBImageName)}
                                                        className="text-sm"
                                                    />
                                                    {editOptionBImageFile && (
                                                        <div className="text-sm text-green-600 flex items-center gap-2">
                                                            ✓ New image selected: {editOptionBImageFile.name}
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionBImage}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option C */}
                                        <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                            <Label className="font-medium text-base">C.</Label>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-c-text">Text</Label>
                                                    <Textarea
                                                        id="edit-option-c-text"
                                                        placeholder="Option C text..."
                                                        value={editOptionC}
                                                        onChange={(e) => setEditOptionC(e.target.value)}
                                                        rows={2}
                                                        className="resize-none"
                                                    />
                                                </div>

                                                {/* Current Image Display */}
                                                {editOptionCImageName && !editOptionCImageFile && (
                                                    <div className="space-y-2">
                                                        <Label>Current Image</Label>
                                                        <div className="relative inline-block">
                                                            <Image
                                                                src={editOptionCImageName && typeof editOptionCImageName === 'string' && editOptionCImageName.startsWith('https://')
                                                                    ? editOptionCImageName
                                                                    : `/api/images/uploaded/${String(editOptionCImageName)}`}
                                                                alt="Current option C image"
                                                                width={150}
                                                                height={100}
                                                                className="rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionCImage}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* New Image Upload */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-c-image">
                                                        {editOptionCImageName && !editOptionCImageFile ? 'Replace Image' : 'Image (Optional)'}
                                                    </Label>
                                                    <Input
                                                        id="edit-option-c-image"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange(setEditOptionCImageFile, setEditOptionCImageName)}
                                                        className="text-sm"
                                                    />
                                                    {editOptionCImageFile && (
                                                        <div className="text-sm text-green-600 flex items-center gap-2">
                                                            ✓ New image selected: {editOptionCImageFile.name}
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionCImage}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option D */}
                                        <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                                            <Label className="font-medium text-base">D.</Label>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-d-text">Text</Label>
                                                    <Textarea
                                                        id="edit-option-d-text"
                                                        placeholder="Option D text..."
                                                        value={editOptionD}
                                                        onChange={(e) => setEditOptionD(e.target.value)}
                                                        rows={2}
                                                        className="resize-none"
                                                    />
                                                </div>

                                                {/* Current Image Display */}
                                                {editOptionDImageName && !editOptionDImageFile && (
                                                    <div className="space-y-2">
                                                        <Label>Current Image</Label>
                                                        <div className="relative inline-block">
                                                            <Image
                                                                src={editOptionDImageName && typeof editOptionDImageName === 'string' && editOptionDImageName.startsWith('https://')
                                                                    ? editOptionDImageName
                                                                    : `/api/images/uploaded/${String(editOptionDImageName)}`}
                                                                alt="Current option D image"
                                                                width={150}
                                                                height={100}
                                                                className="rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionDImage}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* New Image Upload */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-option-d-image">
                                                        {editOptionDImageName && !editOptionDImageFile ? 'Replace Image' : 'Image (Optional)'}
                                                    </Label>
                                                    <Input
                                                        id="edit-option-d-image"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange(setEditOptionDImageFile, setEditOptionDImageName)}
                                                        className="text-sm"
                                                    />
                                                    {editOptionDImageFile && (
                                                        <div className="text-sm text-green-600 flex items-center gap-2">
                                                            ✓ New image selected: {editOptionDImageFile.name}
                                                            <button
                                                                type="button"
                                                                onClick={removeOptionDImage}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Correct Answer Selection */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Correct Answer</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="edit-correct-a"
                                                name="edit-correct-answer"
                                                value="A"
                                                checked={editCorrectAnswer === "A"}
                                                onChange={(e) => setEditCorrectAnswer(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="edit-correct-a" className="text-sm">A</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="edit-correct-b"
                                                name="edit-correct-answer"
                                                value="B"
                                                checked={editCorrectAnswer === "B"}
                                                onChange={(e) => setEditCorrectAnswer(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="edit-correct-b" className="text-sm">B</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="edit-correct-c"
                                                name="edit-correct-answer"
                                                value="C"
                                                checked={editCorrectAnswer === "C"}
                                                onChange={(e) => setEditCorrectAnswer(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="edit-correct-c" className="text-sm">C</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="edit-correct-d"
                                                name="edit-correct-answer"
                                                value="D"
                                                checked={editCorrectAnswer === "D"}
                                                onChange={(e) => setEditCorrectAnswer(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="edit-correct-d" className="text-sm">D</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Explanation */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit-explanation">Explanation</Label>
                                    <Textarea
                                        id="edit-explanation"
                                        placeholder="Explain why this is the correct answer..."
                                        value={editExplanation}
                                        onChange={(e) => setEditExplanation(e.target.value)}
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Difficulty Level */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit-difficulty">Difficulty Level</Label>
                                    <select
                                        id="edit-difficulty"
                                        value={editDifficulty}
                                        onChange={(e) => setEditDifficulty(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select difficulty level</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setEditDialogOpen(false)
                                    resetEditForm()
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateQuestion}
                                    disabled={updating || ((!editQuestionText || editQuestionText.trim() === "") && !editQuestionImageName) || !editCorrectAnswer || ((!editOptionA || editOptionA.trim() === "") && !editOptionAImageName) || ((!editOptionB || editOptionB.trim() === "") && !editOptionBImageName) || ((!editOptionC || editOptionC.trim() === "") && !editOptionCImageName) || ((!editOptionD || editOptionD.trim() === "") && !editOptionDImageName)}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Question"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] max-w-md min-w-[320px] mx-2 sm:mx-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                    <span>Delete Question</span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Are you sure you want to delete this question? This action cannot be undone.
                                </p>

                                {deletingQuestion && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium">Question ID: {deletingQuestion.id}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {deletingQuestion.questionText ?
                                                deletingQuestion.questionText.substring(0, 100) + (deletingQuestion.questionText.length > 100 ? '...' : '') :
                                                'Image question'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDeleteDialogOpen(false)
                                        setDeletingQuestion(null)
                                    }}
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDeleteQuestion}
                                    disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete Question"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Bulk Delete Confirmation Dialog */}
                    <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] max-w-md min-w-[320px] mx-2 sm:mx-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                    <span>Delete Multiple Questions</span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Are you sure you want to delete {selectedQuestions.size} question(s)? This action cannot be undone.
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <p className="text-sm text-red-800">
                                        <strong>Warning:</strong> This will permanently delete all selected questions and cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setBulkDeleteDialogOpen(false)
                                    }}
                                    disabled={bulkDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmBulkDelete}
                                    disabled={bulkDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {bulkDeleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        `Delete ${selectedQuestions.size} Question(s)`
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Header Text - Second */}
                    <div className="space-y-1 mt-1.5 pl-6 pr-6 pt-3">
                        <div className="text-lg font-bold text-gray-900 mb-1">Exam Question Bank</div>
                        <div className="text-sm text-gray-500">Create and manage subjects with their subtopics and question counts.</div>
                    </div>

                    {/* Filter Section - Third */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-4 pl-6 pr-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                            <label htmlFor="subject-filter" className="font-semibold text-base whitespace-nowrap">Subject:</label>
                            <select
                                id="subject-filter"
                                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={loading}
                            >
                                <option value="all">All Subjects</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                            <label htmlFor="subtopic-filter" className="font-semibold text-base whitespace-nowrap">Subtopic:</label>
                            <select
                                id="subtopic-filter"
                                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedSubtopic}
                                onChange={(e) => setSelectedSubtopic(e.target.value)}
                                disabled={!selectedSubject || selectedSubject === 'all' || subtopics.length === 0}
                            >
                                <option value="">Select a subtopic</option>
                                {selectedSubject === 'all' && <option value="all">All Subtopics</option>}
                                {subtopics.map((subtopic) => (
                                    <option key={subtopic.id} value={subtopic.id}>
                                        {subtopic.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                            <label htmlFor="difficulty-filter" className="font-semibold text-base whitespace-nowrap">Difficulty:</label>
                            <select
                                id="difficulty-filter"
                                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                            >
                                <option value="all">All Difficulties</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions Section */}
                    {questions.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 pl-6 pr-6">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedQuestions.size === questions.length && questions.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Select All ({selectedQuestions.size}/{questions.length})
                                    </span>
                                </label>
                            </div>

                            {selectedQuestions.size > 0 && (
                                <Button
                                    onClick={handleBulkDelete}
                                    variant="destructive"
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete Selected ({selectedQuestions.size})
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Questions List - Fourth */}
                    <div className="space-y-4 mt-2 pl-6 pr-6 pb-6">
                        {questionsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-1 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Loading questions...</span>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                <div className="text-lg mb-2">No questions available</div>
                                <div className="text-sm">Select a subject and subtopic to view questions</div>
                            </div>
                        ) : (
                            <div className="space-y-4">

                                {questions.map((question, index) => (
                                    <div key={question.id} className="bg-white border border-gray-300 rounded-sm p-4 sm:p-6 shadow-xs mb-6 mt-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestions.has(question.id)}
                                                    onChange={() => handleSelectQuestion(question.id)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                                    Question {index + 1}
                                                </div>
                                                {question.difficultyLevel && (
                                                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${question.difficultyLevel.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                                                            question.difficultyLevel.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                question.difficultyLevel.toLowerCase() === 'hard' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {question.difficultyLevel.charAt(0).toUpperCase() + question.difficultyLevel.slice(1)}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                    {question.subjectName || 'Unknown Subject'}
                                                </div>
                                                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                    {question.subtopicName || 'Unknown Subtopic'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Edit Question"
                                                    onClick={() => handleEditQuestion(question)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete Question"
                                                    onClick={() => handleDeleteQuestion(question)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <div className="text-xs sm:text-sm text-gray-500">
                                                    {question.createdAt.toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            {question.questionImage ? (
                                                <div className="mb-4">
                                                    <Image
                                                        src={question.questionImage && typeof question.questionImage === 'string' && question.questionImage.startsWith('https://')
                                                            ? question.questionImage
                                                            : `/api/images/uploaded/${String(question.questionImage)}`}
                                                        alt="Question"
                                                        width={400}
                                                        height={300}
                                                        className="max-w-full h-auto rounded-lg border border-gray-200"
                                                    />
                                                </div>
                                            ) : (
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                                    {question.question}
                                                </h3>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className={`p-3 rounded-lg border-2 ${question.correctAnswer === 'A'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                    }`}>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">A.</span>
                                                            {question.correctAnswer === 'A' && (
                                                                <span className="text-green-600 text-xs font-medium">✓ Correct</span>
                                                            )}
                                                        </div>
                                                        {question.optionAImage ? (
                                                            <Image
                                                                src={question.optionAImage && typeof question.optionAImage === 'string' && question.optionAImage.startsWith('https://')
                                                                    ? question.optionAImage
                                                                    : `/api/images/uploaded/${String(question.optionAImage)}`}
                                                                alt="Option A"
                                                                width={300}
                                                                height={200}
                                                                className="max-w-full h-auto rounded border border-gray-200"
                                                            />
                                                        ) : (
                                                            <span className="text-sm">{question.optionA}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`p-3 rounded-lg border-2 ${question.correctAnswer === 'B'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                    }`}>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">B.</span>
                                                            {question.correctAnswer === 'B' && (
                                                                <span className="text-green-600 text-xs font-medium">✓ Correct</span>
                                                            )}
                                                        </div>
                                                        {question.optionBImage ? (
                                                            <Image
                                                                src={question.optionBImage && typeof question.optionBImage === 'string' && question.optionBImage.startsWith('https://')
                                                                    ? question.optionBImage
                                                                    : `/api/images/uploaded/${String(question.optionBImage)}`}
                                                                alt="Option B"
                                                                width={300}
                                                                height={200}
                                                                className="max-w-full h-auto rounded border border-gray-200"
                                                            />
                                                        ) : (
                                                            <span className="text-sm">{question.optionB}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`p-3 rounded-lg border-2 ${question.correctAnswer === 'C'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                    }`}>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">C.</span>
                                                            {question.correctAnswer === 'C' && (
                                                                <span className="text-green-600 text-xs font-medium">✓ Correct</span>
                                                            )}
                                                        </div>
                                                        {question.optionCImage ? (
                                                            <Image
                                                                src={question.optionCImage && typeof question.optionCImage === 'string' && question.optionCImage.startsWith('https://')
                                                                    ? question.optionCImage
                                                                    : `/api/images/uploaded/${String(question.optionCImage)}`}
                                                                alt="Option C"
                                                                width={300}
                                                                height={200}
                                                                className="max-w-full h-auto rounded border border-gray-200"
                                                            />
                                                        ) : (
                                                            <span className="text-sm">{question.optionC}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`p-3 rounded-lg border-2 ${question.correctAnswer === 'D'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                    }`}>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">D.</span>
                                                            {question.correctAnswer === 'D' && (
                                                                <span className="text-green-600 text-xs font-medium">✓ Correct</span>
                                                            )}
                                                        </div>
                                                        {question.optionDImage ? (
                                                            <Image
                                                                src={question.optionDImage && typeof question.optionDImage === 'string' && question.optionDImage.startsWith('https://')
                                                                    ? question.optionDImage
                                                                    : `/api/images/uploaded/${String(question.optionDImage)}`}
                                                                alt="Option D"
                                                                width={300}
                                                                height={200}
                                                                className="max-w-full h-auto rounded border border-gray-200"
                                                            />
                                                        ) : (
                                                            <span className="text-sm">{question.optionD}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {question.explanation && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="text-sm font-medium text-blue-900 mb-1">Explanation:</div>
                                                <div className="text-sm text-blue-800">{question.explanation}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
