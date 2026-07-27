"use client"

import React, { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    X,
    BookOpen,
    Edit,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Loader2
} from "lucide-react"

interface Subtopic {
    id: string
    name: string
    questionCount: number
}

interface Subject {
    id: string
    name: string
    description: string
    subject_time?: number | null
    exam_question_limit?: number
    subjectPicture?: string
    subjectPictureS3Url?: string
    subtopics: Subtopic[]
    createdAt: Date
}

export default function SuperAdminSubjectManagement() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [subjectName, setSubjectName] = useState("")
    const [description, setDescription] = useState("")
    const [subjectTime, setSubjectTime] = useState("")
    const [examQuestionLimit, setExamQuestionLimit] = useState("100")
    const [subjectPicture, setSubjectPicture] = useState("")
    const [subjectPictureS3Url, setSubjectPictureS3Url] = useState("")
    const [uploading, setUploading] = useState(false)
    const [subtopics, setSubtopics] = useState<Subtopic[]>([])

    // Table states
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [questionFilter, setQuestionFilter] = useState("")

    // Add Subtopic Dialog states
    const [addSubtopicDialogOpen, setAddSubtopicDialogOpen] = useState(false)
    const [newSubtopics, setNewSubtopics] = useState<Subtopic[]>([])

    // Edit Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingSubjectData, setEditingSubjectData] = useState<Subject | null>(null)
    const [editSubjectName, setEditSubjectName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editSubjectTime, setEditSubjectTime] = useState("")
    const [editExamQuestionLimit, setEditExamQuestionLimit] = useState("")
    const [editSubjectPicture, setEditSubjectPicture] = useState("")
    const [editSubjectPictureS3Url, setEditSubjectPictureS3Url] = useState("")
    const [editUploading, setEditUploading] = useState(false)
    const [editSubtopics, setEditSubtopics] = useState<Subtopic[]>([])

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)

    // Loading states for operations
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Pagination state
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const [page, setPage] = useState(1)
    const rowsPerPageOptions = [5, 10, 25, 50]

    // Dialog functions
    const addSubtopic = () => {
        const newSubtopic: Subtopic = {
            id: Date.now().toString(),
            name: "",
            questionCount: 0
        }
        setSubtopics([...subtopics, newSubtopic])
    }

    const removeSubtopic = (id: string) => {
        setSubtopics(subtopics.filter(subtopic => subtopic.id !== id))
    }

    const updateSubtopic = (id: string, field: keyof Subtopic, value: string | number) => {
        setSubtopics(subtopics.map(subtopic =>
            subtopic.id === id ? { ...subtopic, [field]: value } : subtopic
        ))
    }

    const handleFileUpload = async (file: File) => {
        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload/subject-image', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                console.log('Upload successful:', result.data)
                setSubjectPicture(result.data.imageId)
                setSubjectPictureS3Url(result.data.s3Url)
                return result.data.imageId
            } else {
                console.error('Upload failed:', result.error)
                return null
            }
        } catch (error) {
            console.error('Upload error:', error)
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            await handleFileUpload(file)
        }
    }

    const handleSubjectCreate = async () => {
        if (!subjectName.trim()) return

        setCreating(true)
        try {
            const subjectData = {
                name: subjectName,
                description: description,
                subject_time: subjectTime ? parseInt(subjectTime) : null,
                exam_question_limit: examQuestionLimit ? parseInt(examQuestionLimit) : 100,
                subjectPicture: subjectPictureS3Url || subjectPicture,
                subtopics: subtopics.filter(subtopic => subtopic.name.trim() !== "")
            }

            const result = await createSubject(subjectData)

            if (result.success) {
                // Reset form
                setSubjectName("")
                setDescription("")
                setSubjectTime("")
                setExamQuestionLimit("100")
                setSubjectPicture("")
                setSubjectPictureS3Url("")
                setSubtopics([])
                setDialogOpen(false)
            } else {
                // Handle error - you might want to show a toast or alert
                console.error('Failed to create subject:', result.error)
            }
        } catch (error) {
            console.error('Error creating subject:', error)
        } finally {
            setCreating(false)
        }
    }

    // Add Subtopic Dialog functions

    const closeAddSubtopicDialog = () => {
        setAddSubtopicDialogOpen(false)
        setNewSubtopics([])
    }

    const addNewSubtopicInput = () => {
        const newSubtopic: Subtopic = {
            id: Date.now().toString(),
            name: "",
            questionCount: 0
        }
        setNewSubtopics([...newSubtopics, newSubtopic])
    }

    const removeNewSubtopic = (id: string) => {
        setNewSubtopics(newSubtopics.filter(subtopic => subtopic.id !== id))
    }

    const updateNewSubtopic = (id: string, field: keyof Subtopic, value: string | number) => {
        setNewSubtopics(newSubtopics.map(subtopic =>
            subtopic.id === id ? { ...subtopic, [field]: value } : subtopic
        ))
    }

    const saveNewSubtopics = async () => {
        if (!selectedSubject) return

        try {
            const validSubtopics = newSubtopics.filter(st => st.name.trim())

            for (const subtopic of validSubtopics) {
                const response = await fetch(`/api/subjects/${selectedSubject.id}/subtopics`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: subtopic.name.trim(),
                        questionCount: subtopic.questionCount
                    }),
                })

                const result = await response.json()

                if (!result.success) {
                    console.error('Failed to create subtopic:', result.error)
                    return
                }
            }

            // Refresh the subject data
            await fetchSubjects()

            // Close dialog and reset
            closeAddSubtopicDialog()

        } catch (error) {
            console.error('Error saving subtopics:', error)
        }
    }

    // Edit Dialog functions
    const openEditDialog = (subject: Subject) => {
        setEditingSubjectData(subject)
        setEditSubjectName(subject.name)
        setEditDescription(subject.description)
        setEditSubjectTime(subject.subject_time ? subject.subject_time.toString() : "")
        setEditExamQuestionLimit(subject.exam_question_limit ? subject.exam_question_limit.toString() : "100")
        setEditSubjectPicture(subject.subjectPicture || "")
        setEditSubjectPictureS3Url(subject.subjectPictureS3Url || "")
        setEditSubtopics([...subject.subtopics])
        setEditDialogOpen(true)
    }

    const closeEditDialog = () => {
        setEditDialogOpen(false)
        setEditingSubjectData(null)
        setEditSubjectName("")
        setEditDescription("")
        setEditSubjectTime("")
        setEditExamQuestionLimit("")
        setEditSubjectPicture("")
        setEditSubjectPictureS3Url("")
        setEditSubtopics([])
    }

    const handleEditFileUpload = async (file: File) => {
        try {
            setEditUploading(true)
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload/subject-image', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                setEditSubjectPicture(result.data.imageId)
                setEditSubjectPictureS3Url(result.data.s3Url)
                return result.data.imageId
            } else {
                console.error('Upload failed:', result.error)
                return null
            }
        } catch (error) {
            console.error('Upload error:', error)
            return null
        } finally {
            setEditUploading(false)
        }
    }

    const handleEditFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            await handleEditFileUpload(file)
        }
    }

    const addEditSubtopic = () => {
        const newSubtopic: Subtopic = {
            id: Date.now().toString(),
            name: "",
            questionCount: 0
        }
        setEditSubtopics([...editSubtopics, newSubtopic])
    }

    const removeEditSubtopic = (id: string) => {
        setEditSubtopics(editSubtopics.filter(subtopic => subtopic.id !== id))
    }

    const updateEditSubtopic = (id: string, field: keyof Subtopic, value: string | number) => {
        setEditSubtopics(editSubtopics.map(subtopic =>
            subtopic.id === id ? { ...subtopic, [field]: value } : subtopic
        ))
    }

    const handleSubjectUpdate = async () => {
        if (!editingSubjectData || !editSubjectName.trim()) return

        setUpdating(true)
        try {
            const response = await fetch(`/api/subjects/${editingSubjectData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editSubjectName,
                    description: editDescription,
                    subject_time: editSubjectTime ? parseInt(editSubjectTime) : null,
                    exam_question_limit: editExamQuestionLimit ? parseInt(editExamQuestionLimit) : 100,
                    subjectPicture: editSubjectPictureS3Url || editSubjectPicture || editingSubjectData.subjectPicture,
                    subtopics: editSubtopics.filter(subtopic => subtopic.name.trim() !== "")
                }),
            })

            const result = await response.json()

            if (result.success) {
                // Update the subject in the list
                setSubjects(subjects.map(subject =>
                    subject.id === editingSubjectData.id
                        ? {
                            ...subject,
                            name: editSubjectName,
                            description: editDescription,
                            subject_time: editSubjectTime ? parseInt(editSubjectTime) : null,
                            exam_question_limit: editExamQuestionLimit ? parseInt(editExamQuestionLimit) : 100,
                            subjectPicture: editSubjectPicture,
                            subtopics: editSubtopics.filter(subtopic => subtopic.name.trim() !== "")
                        }
                        : subject
                ))
                closeEditDialog()
            } else {
                console.error('Failed to update subject:', result.error)
            }
        } catch (error) {
            console.error('Error updating subject:', error)
        } finally {
            setUpdating(false)
        }
    }

    // Delete functions
    const openDeleteDialog = (subject: Subject) => {
        setSubjectToDelete(subject)
        setDeleteDialogOpen(true)
    }

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false)
        setSubjectToDelete(null)
    }

    const confirmDeleteSubject = async () => {
        if (!subjectToDelete) return

        setDeleting(true)
        try {
            const result = await deleteSubject(subjectToDelete.id)

            if (result.success) {
                closeDeleteDialog()
            } else {
                console.error('Failed to delete subject:', result.error)
            }
        } catch (error) {
            console.error('Error deleting subject:', error)
        } finally {
            setDeleting(false)
        }
    }

    // Pagination logic
    const filteredSubjects = subjects.filter(subject => {
        // Search filter
        const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.subtopics.some(subtopic =>
                subtopic.name.toLowerCase().includes(searchTerm.toLowerCase())
            )

        // Question count filter
        const totalQuestions = subject.subtopics.reduce((total, subtopic) => total + subtopic.questionCount, 0)
        let matchesQuestionFilter = true

        if (questionFilter) {
            switch (questionFilter) {
                case "0-10":
                    matchesQuestionFilter = totalQuestions >= 0 && totalQuestions <= 10
                    break
                case "11-25":
                    matchesQuestionFilter = totalQuestions >= 11 && totalQuestions <= 25
                    break
                case "26-50":
                    matchesQuestionFilter = totalQuestions >= 26 && totalQuestions <= 50
                    break
                case "51-100":
                    matchesQuestionFilter = totalQuestions >= 51 && totalQuestions <= 100
                    break
                case "100+":
                    matchesQuestionFilter = totalQuestions > 100
                    break
                default:
                    matchesQuestionFilter = true
            }
        }

        return matchesSearch && matchesQuestionFilter
    })

    const totalRows = filteredSubjects.length
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
    const paginatedSubjects = filteredSubjects.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    const startRow = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1
    const endRow = Math.min(page * rowsPerPage, totalRows)

    // Reset to first page when search term changes
    React.useEffect(() => {
        setPage(1)
    }, [searchTerm])

    // Reset to first page when rowsPerPage changes
    React.useEffect(() => {
        setPage(1)
    }, [rowsPerPage])

    // API Functions
    const fetchSubjects = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/subjects')
            const result = await response.json()

            if (result.success) {
                // Ensure dates are properly converted to Date objects
                const subjectsWithDates = result.data.map((subject: { id: string; name: string; description: string; subject_time?: number; exam_question_limit?: number; subject_picture?: string; subject_picture_s3_url?: string; subtopics: Array<{ id: string; name: string; question_count: number; created_at: string }>; created_at: string }) => ({
                    ...subject,
                    subject_time: subject.subject_time,
                    exam_question_limit: subject.exam_question_limit,
                    subjectPicture: subject.subject_picture,
                    subjectPictureS3Url: subject.subject_picture_s3_url,
                    createdAt: new Date(subject.created_at),
                    subtopics: subject.subtopics.map((subtopic: { id: string; name: string; question_count: number; created_at: string }) => ({
                        ...subtopic,
                        createdAt: new Date(subtopic.created_at)
                    }))
                }))
                setSubjects(subjectsWithDates)
            } else {
                setError(result.error || 'Failed to fetch subjects')
            }
        } catch (err) {
            setError('Failed to connect to server')
            console.error('Error fetching subjects:', err)
        } finally {
            setLoading(false)
        }
    }

    const createSubject = async (subjectData: { name: string; description: string; subject_time?: number | null; exam_question_limit?: number; subtopics: Subtopic[] }) => {
        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subjectData),
            })

            const result = await response.json()

            if (result.success) {
                // Ensure dates are properly converted to Date objects
                const subjectWithDates = {
                    ...result.data,
                    createdAt: new Date(result.data.created_at),
                    subtopics: result.data.subtopics.map((subtopic: { id: string; name: string; question_count: number; created_at: string }) => ({
                        ...subtopic,
                        createdAt: new Date(subtopic.created_at)
                    }))
                }
                setSubjects(prev => [subjectWithDates, ...prev])
                return { success: true, data: subjectWithDates }
            } else {
                return { success: false, error: result.error }
            }
        } catch (err) {
            console.error('Error creating subject:', err)
            return { success: false, error: 'Failed to create subject' }
        }
    }

    const deleteSubject = async (id: string) => {
        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (result.success) {
                setSubjects(prev => prev.filter(subject => subject.id !== id))
                return { success: true }
            } else {
                return { success: false, error: result.error }
            }
        } catch (err) {
            console.error('Error deleting subject:', err)
            return { success: false, error: 'Failed to delete subject' }
        }
    }

    // Fetch subjects on component mount
    React.useEffect(() => {
        fetchSubjects()
    }, [])

    return (
        <ProtectedRoute allowedRoles={['super-admin']}>
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
                                        <BreadcrumbLink href="/super-admin">
                                            Dashboard
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Subject Management</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-6 pt-0 max-w-full overflow-hidden">
                        {/* Create Subject Button - First */}
                        <div className="flex items-center">
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-green-600 cursor-pointer hover:bg-green-900 text-primary-foreground">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Subject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center space-x-2">
                                            <BookOpen className="h-5 w-5" />
                                            <span>Create New Subject</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                            Create a new subject with its subtopics and question counts.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 py-4">
                                        {/* Subject Picture */}
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-picture">Subject Picture</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    id="subject-picture"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    disabled={uploading}
                                                    className="cursor-pointer"
                                                />
                                                {uploading && (
                                                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        <span>Uploading image...</span>
                                                    </div>
                                                )}
                                                {(subjectPicture || subjectPictureS3Url) && !uploading && (
                                                    <div className="flex items-center space-x-2">
                                                        <img
                                                            src={subjectPictureS3Url || `/api/images/uploaded/${String(subjectPicture)}`}
                                                            alt="Preview"
                                                            className="w-16 h-16 object-cover rounded border border-gray-200"
                                                            onLoad={() => console.log('Preview image loaded successfully')}
                                                            onError={(e) => console.error('Preview image failed to load:', e)}
                                                        />
                                                        <span className="text-sm text-green-600">✓ Image uploaded successfully</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Upload an image for this subject (optional). Max size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                                            </p>
                                        </div>

                                        {/* Subject Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-name">Subject Name *</Label>
                                            <Input
                                                id="subject-name"
                                                placeholder="Enter subject name"
                                                value={subjectName}
                                                onChange={(e) => setSubjectName(e.target.value)}
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Enter subject description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        {/* Subject Time */}
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-time">Subject Time</Label>
                                            <select
                                                id="subject-time"
                                                value={subjectTime}
                                                onChange={(e) => setSubjectTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select duration</option>
                                                <option value="1">1 Hour</option>
                                                <option value="2">2 Hours</option>
                                                <option value="3">3 Hours</option>
                                                <option value="4">4 Hours</option>
                                                <option value="5">5 Hours</option>
                                            </select>
                                        </div>

                                        {/* Exam Question Limit */}
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-question-limit">Exam Questions Limit</Label>
                                            <Input
                                                id="exam-question-limit"
                                                type="number"
                                                min="1"
                                                placeholder="Enter number of questions for exam (e.g. 100)"
                                                value={examQuestionLimit}
                                                onChange={(e) => setExamQuestionLimit(e.target.value)}
                                            />
                                        </div>

                                        {/* Subtopics Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Subtopics</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addSubtopic}
                                                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Subtopic
                                                </Button>
                                            </div>

                                            {subtopics.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No subtopics added yet</p>
                                                    <p className="text-sm">Click &quot;Add Subtopic&quot; to get started</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {subtopics.map((subtopic) => (
                                                        <div key={subtopic.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-muted/50">
                                                            <div className="flex-1 space-y-2 w-full">
                                                                <Input
                                                                    placeholder="Subtopic name"
                                                                    value={subtopic.name}
                                                                    onChange={(e) => updateSubtopic(subtopic.id, "name", e.target.value)}
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Number of questions"
                                                                    value={subtopic.questionCount || ""}
                                                                    onChange={(e) => updateSubtopic(subtopic.id, "questionCount", parseInt(e.target.value) || 0)}
                                                                    min="0"
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeSubtopic(subtopic.id)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-auto"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubjectCreate}
                                            disabled={!subjectName.trim() || creating}
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create Subject"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Header Text - Second */}
                        <div className="space-y-1">
                            <div className="text-lg font-bold text-gray-900 mb-1">Subject Management</div>
                            <div className="text-sm text-gray-500">Create and manage subjects with their subtopics and question counts.</div>
                        </div>

                        {/* Search Input and Filter - Third */}
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                            {/* Search Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                                <Label htmlFor="search-input" className="font-semibold text-base whitespace-nowrap">
                                    Search:
                                </Label>
                                <Input
                                    id="search-input"
                                    type="text"
                                    className="w-full sm:w-64 lg:w-80"
                                    placeholder="Search subject or subtopic..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Label htmlFor="question-filter" className="font-semibold text-base whitespace-nowrap">
                                    Filter by questions:
                                </Label>
                                <select
                                    id="question-filter"
                                    className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    value={questionFilter}
                                    onChange={(e) => setQuestionFilter(e.target.value)}
                                >
                                    <option value="">All questions</option>
                                    <option value="0-10">0-10 questions</option>
                                    <option value="11-25">11-25 questions</option>
                                    <option value="26-50">26-50 questions</option>
                                    <option value="51-100">51-100 questions</option>
                                    <option value="100+">100+ questions</option>
                                </select>
                            </div>
                        </div>


                        {/* Subjects Table - Fourth */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading subjects...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <div className="text-red-500 mb-4">
                                        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-red-600 font-medium">Error loading subjects</p>
                                        <p className="text-sm text-red-500 mt-1">{error}</p>
                                    </div>
                                    <Button
                                        onClick={fetchSubjects}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Table Container - Fixed */}
                                    <div className="border border-gray-300 rounded-sm overflow-hidden">
                                        {/* Table Content with Horizontal Scroll */}
                                        <div className="overflow-x-auto">
                                            <Table className="min-w-[800px]">
                                                <TableHeader>
                                                    <TableRow className="align-middle h-4">
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[150px]">Subject</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px] hidden md:table-cell">Time</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px] hidden md:table-cell">Exam Questions</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[100px]">Subtopics</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px]">Total Questions</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px] hidden md:table-cell">Created Date</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[100px]">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {subjects.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center py-2 text-gray-500">
                                                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                                <p className="text-gray-600">No subjects created yet</p>
                                                                <p className="text-sm text-gray-500 mt-1">Create your first subject to get started</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : paginatedSubjects.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center py-2 text-gray-500">
                                                                No subjects found matching your search.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        paginatedSubjects.map((subject) => (
                                                            <TableRow key={subject.id} className="align-middle h-6">
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <div>
                                                                        <p className="font-medium">{subject.name}</p>
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell className="whitespace-nowrap py-2 hidden md:table-cell">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.subject_time ? `${subject.subject_time} Hour${subject.subject_time !== 1 ? 's' : ''}` : 'Not set'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2 hidden md:table-cell">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.exam_question_limit || 100} Qs
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.subtopics.length} subtopic{subject.subtopics.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.subtopics.reduce((total, subtopic) => total + subtopic.questionCount, 0)} questions
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2 hidden md:table-cell">
                                                                    <span className="text-sm">
                                                                        {subject.createdAt.toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="bg-black text-white border-black hover:bg-gray-800 hover:text-white h-7 w-7 p-0"
                                                                            onClick={() => setSelectedSubject(subject)}
                                                                            title="View Subject"
                                                                        >
                                                                            <BookOpen className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white h-7 w-7 p-0"
                                                                            onClick={() => openEditDialog(subject)}
                                                                            title="Edit Subject"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white h-7 w-7 p-0"
                                                                            onClick={() => openDeleteDialog(subject)}
                                                                            title="Delete Subject"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Pagination Controls - Fixed Position */}
                                    <div className="flex flex-wrap items-center justify-between text-sm px-0">
                                        <div className='text-sm text-gray-500'>
                                            {totalRows === 0 ? '0' : `${startRow} - ${endRow}`} of {totalRows} row(s)
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Rows per page</span>
                                            <select
                                                className="border rounded px-2 py-1"
                                                value={rowsPerPage}
                                                onChange={e => setRowsPerPage(Number(e.target.value))}
                                            >
                                                {rowsPerPageOptions.map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                                aria-label="Previous page"
                                                type="button"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-2">Page {page} of {totalPages}</span>
                                            <button
                                                className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === totalPages}
                                                aria-label="Next page"
                                                type="button"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Subject Details Dialog */}
                        <Dialog open={!!selectedSubject && !addSubtopicDialogOpen} onOpenChange={open => !open && setSelectedSubject(null)}>
                            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col">
                                <DialogHeader className="flex-shrink-0">
                                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Subject Details
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600">
                                        View subject information and subtopics
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedSubject && (
                                    <div className="flex-1 overflow-y-auto space-y-6">
                                        {/* Subject Information Card */}
                                        <Card>

                                            <CardContent className="space-y-4">
                                                {/* Subject Picture and Basic Info */}
                                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-700">Subject Name</Label>
                                                            <p className="text-lg font-semibold text-gray-900 mt-1">{selectedSubject.name}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-700">Description</Label>
                                                            <p className="text-gray-600 mt-1">{selectedSubject.description || "No description provided"}</p>
                                                        </div>
                                                        <div className="flex gap-4 text-sm text-gray-500">
                                                            <span>Created: {selectedSubject.createdAt.toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}</span>
                                                            <span>•</span>
                                                            <span>{selectedSubject.subtopics.length} subtopic{selectedSubject.subtopics.length !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Subtopics Card */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg">Subtopics</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {selectedSubject.subtopics.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                        <p className="text-lg">No subtopics added yet</p>
                                                        <p className="text-sm mt-1">Subtopics will be displayed here when added</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {selectedSubject.subtopics.map((subtopic, idx) => (
                                                            <div key={subtopic.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{subtopic.name}</p>
                                                                    </div>
                                                                </div>
                                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                                    {subtopic.questionCount} questions
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Edit Subject Dialog */}
                        <Dialog open={editDialogOpen} onOpenChange={open => !open && closeEditDialog()}>
                            <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                        <Edit className="h-5 w-5" />
                                        <span>Edit Subject</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Edit subject information and manage subtopics
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {/* Subject Picture */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-subject-picture">Subject Picture</Label>
                                        <div className="space-y-2">
                                            <Input
                                                id="edit-subject-picture"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleEditFileChange}
                                                disabled={editUploading}
                                                className="cursor-pointer"
                                            />
                                            {editUploading && (
                                                <div className="flex items-center space-x-2 text-sm text-blue-600">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    <span>Uploading image...</span>
                                                </div>
                                            )}
                                            {(editSubjectPicture || editSubjectPictureS3Url) && !editUploading && (
                                                <div className="flex items-center space-x-2">
                                                    <img
                                                        src={editSubjectPictureS3Url || `/api/images/uploaded/${String(editSubjectPicture)}`}
                                                        alt="Preview"
                                                        className="w-16 h-16 object-cover rounded border border-gray-200"
                                                        onLoad={() => console.log('Edit preview image loaded successfully')}
                                                        onError={(e) => console.error('Edit preview image failed to load:', e)}
                                                    />
                                                    <span className="text-sm text-green-600">✓ Image uploaded successfully</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Upload an image for this subject (optional). Max size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                                        </p>
                                    </div>

                                    {/* Subject Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-subject-name">Subject Name *</Label>
                                        <Input
                                            id="edit-subject-name"
                                            placeholder="Enter subject name"
                                            value={editSubjectName}
                                            onChange={(e) => setEditSubjectName(e.target.value)}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-description">Description</Label>
                                        <Textarea
                                            id="edit-description"
                                            placeholder="Enter subject description"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    {/* Subject Time */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-subject-time">Subject Time</Label>
                                        <select
                                            id="edit-subject-time"
                                            value={editSubjectTime}
                                            onChange={(e) => setEditSubjectTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select duration</option>
                                            <option value="1">1 Hour</option>
                                            <option value="2">2 Hours</option>
                                            <option value="3">3 Hours</option>
                                            <option value="4">4 Hours</option>
                                            <option value="5">5 Hours</option>
                                        </select>
                                    </div>

                                    {/* Exam Question Limit */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-exam-question-limit">Exam Questions Limit</Label>
                                        <Input
                                            id="edit-exam-question-limit"
                                            type="number"
                                            min="1"
                                            placeholder="Enter number of questions for exam (e.g. 100)"
                                            value={editExamQuestionLimit}
                                            onChange={(e) => setEditExamQuestionLimit(e.target.value)}
                                        />
                                    </div>

                                    {/* Subtopics Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Subtopics</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addEditSubtopic}
                                                className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Subtopic
                                            </Button>
                                        </div>

                                        {editSubtopics.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No subtopics added yet</p>
                                                <p className="text-sm">Click &quot;Add Subtopic&quot; to get started</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {editSubtopics.map((subtopic) => (
                                                    <div key={subtopic.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-muted/50">
                                                        <div className="flex-1 space-y-2 w-full">
                                                            <Input
                                                                placeholder="Subtopic name"
                                                                value={subtopic.name}
                                                                onChange={(e) => updateEditSubtopic(subtopic.id, "name", e.target.value)}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Number of questions"
                                                                value={subtopic.questionCount || ""}
                                                                onChange={(e) => updateEditSubtopic(subtopic.id, "questionCount", parseInt(e.target.value) || 0)}
                                                                min="0"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeEditSubtopic(subtopic.id)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-auto"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={closeEditDialog}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubjectUpdate}
                                        disabled={!editSubjectName.trim() || updating}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={deleteDialogOpen} onOpenChange={open => !open && closeDeleteDialog()}>
                            <DialogContent className="w-[95vw] max-w-[400px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2 text-red-600">
                                        <Trash2 className="h-5 w-5" />
                                        <span>Delete Subject</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete &quot;{subjectToDelete?.name}&quot;? This action cannot be undone and will also delete all associated subtopics.
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogFooter>
                                    <Button variant="outline" onClick={closeDeleteDialog}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmDeleteSubject}
                                        disabled={deleting}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            "Delete Subject"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Add Subtopic Dialog */}
                        <Dialog open={addSubtopicDialogOpen} onOpenChange={open => !open && closeAddSubtopicDialog()}>
                            <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                        <Plus className="h-5 w-5" />
                                        <span>Add New Subtopics</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Add new subtopics to &quot;{selectedSubject?.name}&quot;
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {/* Subtopics Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Subtopics</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addNewSubtopicInput}
                                                className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Another
                                            </Button>
                                        </div>

                                        {newSubtopics.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No subtopics added yet</p>
                                                <p className="text-sm">Click &quot;Add Another&quot; to get started</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {newSubtopics.map((subtopic) => (
                                                    <div key={subtopic.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-muted/50">
                                                        <div className="flex-1 space-y-2 w-full">
                                                            <Input
                                                                placeholder="Subtopic name"
                                                                value={subtopic.name}
                                                                onChange={(e) => updateNewSubtopic(subtopic.id, "name", e.target.value)}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Number of questions"
                                                                value={subtopic.questionCount || ""}
                                                                onChange={(e) => updateNewSubtopic(subtopic.id, "questionCount", parseInt(e.target.value) || 0)}
                                                                min="0"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeNewSubtopic(subtopic.id)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-auto"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={closeAddSubtopicDialog}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={saveNewSubtopics}
                                        disabled={newSubtopics.length === 0 || !newSubtopics.some(st => st.name.trim())}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        Save Subtopics
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
