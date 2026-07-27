"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserListDialog } from "@/components/ui/user-list-dialog"
import { UserDetailsDialog } from "@/components/ui/user-details-dialog"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface SubjectStats {
    id: string
    name: string
    description: string
    subjectPicture: string
    uniqueStudents: number
    totalExams: number
    averageScore: string
    highestScore: string
    lowestScore: string
}

export default function SuperAdminProgressTracker() {
    const [subjects, setSubjects] = useState<SubjectStats[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState<SubjectStats | null>(null)
    const [showUserList, setShowUserList] = useState(false)
    const [showUserDetails, setShowUserDetails] = useState(false)
    const [selectedUser, setSelectedUser] = useState<{ id: string; studentId: string; fullName: string; username: string; profilePicture: string; examCount: number; averageScore: string; bestScore: string; worstScore: string; lastExamDate: Date } | null>(null)
    
    // Search and pagination state
    const [searchTerm, setSearchTerm] = useState("")
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [page, setPage] = useState(1)
    const rowsPerPageOptions = [5, 10, 25, 50]

    useEffect(() => {
        fetchSubjectStats()
    }, [])

    const fetchSubjectStats = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/progress/subject-stats')
            const result = await response.json()
            
            if (result.success) {
                setSubjects(result.data)
            } else {
                console.error('Failed to fetch subject stats:', result.error)
            }
        } catch (error) {
            console.error('Error fetching subject stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleViewStudents = (subject: SubjectStats) => {
        setSelectedSubject(subject)
        setShowUserList(true)
        setShowUserDetails(false) // Ensure user details is closed
    }

    const handleCloseUserList = () => {
        setShowUserList(false)
        setSelectedSubject(null)
        setShowUserDetails(false) // Ensure user details is closed
    }

    const handleUserClick = (user: { id: string; studentId: string; fullName: string; username: string; profilePicture: string; examCount: number; averageScore: string; bestScore: string; worstScore: string; lastExamDate: Date }) => {
        setSelectedUser(user)
        setShowUserList(false) // Close user list
        setShowUserDetails(true) // Open user details
    }

    const handleCloseUserDetails = () => {
        setShowUserDetails(false)
        setSelectedUser(null)
        setShowUserList(true) // Reopen user list
    }


    // Filter and pagination logic
    const filteredSubjects = subjects.filter(subject => {
        const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    const totalRows = filteredSubjects.length
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
    const paginatedSubjects = filteredSubjects.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    const startRow = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1
    const endRow = Math.min(page * rowsPerPage, totalRows)

    // Reset to first page when search term changes
    useEffect(() => {
        setPage(1)
    }, [searchTerm])

    // Reset to first page when rowsPerPage changes
    useEffect(() => {
        setPage(1)
    }, [rowsPerPage])

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
                                        <BreadcrumbPage>Progress Tracker</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-6 pt-0">
                        {/* Header Section */}
                        <div className="space-y-2">
                            <h1 className="text-lg font-bold tracking-tight">Progress Tracker</h1>
                            <p className="text-sm text-muted-foreground">
                                Monitor student progress and exam performance across all subjects
                            </p>
                        </div>

                        {/* Search and Filter Section */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">Search:</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by subject name or description..."
                                        className="pl-8 w-full sm:w-80"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading subjects...</p>
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
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px]">Students</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px]">Total Exams</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px]">Average Score</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[120px]">Best Score</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 min-w-[100px]">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredSubjects.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-2 text-gray-500">
                                                                {searchTerm ? 'No subjects found matching your search.' : 'No subjects found. Create some subjects to start tracking progress.'}
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
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.uniqueStudents} students
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.totalExams} exams
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.averageScore}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="text-sm text-gray-700">
                                                                        {subject.highestScore}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="bg-black text-white border-black hover:bg-gray-800 hover:text-white h-7 px-3 text-xs"
                                                                        onClick={() => handleViewStudents(subject)}
                                                                        disabled={subject.uniqueStudents === 0}
                                                                    >
                                                                        <span>View Students</span>
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {startRow} - {endRow} of {totalRows} row(s)
                            </div>
                            <div className="flex items-center space-x-2">
                                <span>Rows per page:</span>
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
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* User List Dialog */}
            {selectedSubject && (
                <UserListDialog
                    isOpen={showUserList}
                    onClose={handleCloseUserList}
                    subjectId={selectedSubject.id}
                    subjectName={selectedSubject.name}
                    onUserClick={handleUserClick}
                />
            )}
            
            {selectedUser && selectedSubject && (
                <UserDetailsDialog
                    isOpen={showUserDetails}
                    onClose={handleCloseUserDetails}
                    user={selectedUser}
                    subjectId={selectedSubject.id}
                    subjectName={selectedSubject.name}
                />
            )}
        </ProtectedRoute>
    )
}
