"use client"

import React, { useState } from "react"
import Image from "next/image"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
    Edit,
    Trash2,
    User,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react"

interface User {
    id: string
    studentId: string
    profilePicture?: string
    fullName: string
    username: string
    password?: string // Optional since API doesn't return passwords
    role: 'Student' | 'Instructor'
    createdAt: Date
}

export default function SuperAdminUserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [studentId, setStudentId] = useState("")
    const [fullName, setFullName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState<'Student' | 'Instructor'>('Student')
    const [uploading, setUploading] = useState(false)
    const [profilePicture, setProfilePicture] = useState("")
    const [profilePictureS3Url, setProfilePictureS3Url] = useState("")

    // Edit states
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showEditPassword, setShowEditPassword] = useState(false)

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Loading states for operations
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("")

    // Pagination state
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const [page, setPage] = useState(1)
    const rowsPerPageOptions = [5, 10, 25, 50]

    // API Functions
    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/users')
            const result = await response.json()

            if (result.success) {
                setUsers(result.data)
            } else {
                setError(result.error || 'Failed to fetch users')
            }
        } catch (err) {
            setError('Failed to connect to server')
            console.error('Error fetching users:', err)
        } finally {
            setLoading(false)
        }
    }

    // File upload handler
    const handleFileUpload = async (file: File) => {
        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                setProfilePicture(result.imageId)
                setProfilePictureS3Url(result.s3Url)
                return result.imageId
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

    // User creation handler
    const handleUserCreate = async () => {
        if (!studentId.trim() || !fullName.trim() || !username.trim() || !password.trim() || password.length < 8) return

        setCreating(true)
        try {
            const userData = {
                studentId: studentId.trim(),
                fullName: fullName.trim(),
                username: username.trim(),
                password: password.trim(),
                role,
                profilePicture
            }

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            })

            const result = await response.json()

            if (result.success) {
                // Refresh users list
                await fetchUsers()

                // Reset form
                setStudentId("")
                setFullName("")
                setUsername("")
                setPassword("")
                setRole("Student")
                setProfilePicture("")
                setProfilePictureS3Url("")
                setDialogOpen(false)
            } else {
                console.error('Failed to create user:', result.error)
                setError(result.error || 'Failed to create user')
            }
        } catch (err) {
            console.error('Error creating user:', err)
            setError('Failed to create user')
        } finally {
            setCreating(false)
        }
    }

    // Edit user handler
    const handleUserEdit = (user: User) => {
        setEditingUser(user)
        setStudentId(user.studentId || "")
        setFullName(user.fullName || "")
        setUsername(user.username || "")
        setPassword("") // Don't populate password for security
        setRole(user.role || "Student")
        setProfilePicture(user.profilePicture || "")
        setProfilePictureS3Url(user.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.startsWith('https://') ? user.profilePicture : "")
        setEditDialogOpen(true)
    }

    const handleUserUpdate = async () => {
        if (!editingUser || !studentId.trim() || !fullName.trim() || !username.trim() || !password.trim() || password.length < 8) return

        setUpdating(true)
        try {
            const userData = {
                studentId: studentId.trim(),
                fullName: fullName.trim(),
                username: username.trim(),
                password: password.trim(),
                role,
                profilePicture
            }

            const response = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            })

            const result = await response.json()

            if (result.success) {
                // Refresh users list
                await fetchUsers()

                // Reset form
                setEditingUser(null)
                setStudentId("")
                setFullName("")
                setUsername("")
                setPassword("")
                setRole("Student")
                setProfilePicture("")
                setProfilePictureS3Url("")
                setEditDialogOpen(false)
            } else {
                console.error('Failed to update user:', result.error)
                setError(result.error || 'Failed to update user')
            }
        } catch (err) {
            console.error('Error updating user:', err)
            setError('Failed to update user')
        } finally {
            setUpdating(false)
        }
    }

    // Delete user handler
    const handleUserDelete = (user: User) => {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!userToDelete) return

        try {
            setDeleting(true)
            const response = await fetch(`/api/users/${userToDelete.id}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (result.success) {
                // Refresh users list
                await fetchUsers()
                setDeleteDialogOpen(false)
                setUserToDelete(null)
            } else {
                console.error('Failed to delete user:', result.error)
                setError(result.error || 'Failed to delete user')
            }
        } catch (err) {
            console.error('Error deleting user:', err)
            setError('Failed to delete user')
        } finally {
            setDeleting(false)
        }
    }

    const cancelDelete = () => {
        setDeleteDialogOpen(false)
        setUserToDelete(null)
    }

    // Filter and pagination logic
    const filteredUsers = users.filter(user => {
        // Do not display Super Admin users in the user management table
        if (user.role === 'Super Admin' as any || user.role === 'super-admin' as any) {
            return false
        }

        const matchesSearch = user.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRoleFilter = !roleFilter || user.role === roleFilter

        return matchesSearch && matchesRoleFilter
    })

    const totalRows = filteredUsers.length
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
    const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    const startRow = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1
    const endRow = Math.min(page * rowsPerPage, totalRows)

    // Reset to first page when search term changes
    React.useEffect(() => {
        setPage(1)
    }, [searchTerm, roleFilter])

    // Reset to first page when rowsPerPage changes
    React.useEffect(() => {
        setPage(1)
    }, [rowsPerPage])

    // Load users on component mount
    React.useEffect(() => {
        fetchUsers()
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
                                        <BreadcrumbPage>User Management</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-6 pt-0 w-full h-full overflow-hidden">
                        {/* Create User Account Button - First */}
                        <div className="flex items-center">
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-green-600 cursor-pointer hover:bg-green-900 text-primary-foreground">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create User Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center space-x-2">
                                            <User className="h-5 w-5" />
                                            <span>Create New User Account</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                            Create a new user account with student ID, profile information, and role.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 py-4">
                                        {/* Profile Picture */}
                                        <div className="space-y-2">
                                            <Label htmlFor="profile-picture">Profile Picture</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    id="profile-picture"
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
                                                {profilePicture && !uploading && (
                                                    <div className="flex items-center space-x-2">
                                                        <Image
                                                            src={profilePictureS3Url || `/api/images/uploaded/${String(profilePicture)}`}
                                                            alt="Preview"
                                                            width={64}
                                                            height={64}
                                                            className="w-16 h-16 object-cover rounded border border-gray-200"
                                                        />
                                                        <span className="text-sm text-green-600">✓ Image uploaded successfully</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Upload a profile picture (optional). Max size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                                            </p>
                                        </div>

                                        {/* Student ID */}
                                        <div className="space-y-2">
                                            <Label htmlFor="student-id">Student ID *</Label>
                                            <Input
                                                id="student-id"
                                                placeholder="Enter student ID"
                                                value={studentId}
                                                onChange={(e) => setStudentId(e.target.value)}
                                            />
                                        </div>

                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="full-name">Full Name *</Label>
                                            <Input
                                                id="full-name"
                                                placeholder="Enter full name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>

                                        {/* Username */}
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username *</Label>
                                            <Input
                                                id="username"
                                                placeholder="Enter username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password * (minimum 8 characters)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter password (minimum 8 characters)"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Password must be at least 8 characters long ({password.length}/8+)
                                            </p>
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role *</Label>
                                            <select
                                                id="role"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as 'Student' | 'Instructor')}
                                            >
                                                <option value="Student">Student</option>
                                                <option value="Instructor">Instructor</option>
                                            </select>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleUserCreate}
                                            disabled={!studentId.trim() || !fullName.trim() || !username.trim() || !password.trim() || password.length < 8 || creating}
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create User Account"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Header Text - Second */}
                        <div className="space-y-1">
                            <div className="text-lg font-bold text-gray-900 mb-1">User Management</div>
                            <div className="text-sm text-gray-500">Create and manage user accounts with their profile information and roles.</div>
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
                                    placeholder="Search by student ID, name, or username..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Label htmlFor="role-filter" className="font-semibold text-base whitespace-nowrap">
                                    Filter by role:
                                </Label>
                                <select
                                    id="role-filter"
                                    className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="">All roles</option>
                                    <option value="Student">Student</option>
                                    <option value="Instructor">Instructor</option>
                                </select>
                            </div>
                        </div>

                        {/* Users Table - Fourth */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading users...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <div className="text-red-500 mb-4">
                                        <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-red-600 font-medium">Error loading users</p>
                                        <p className="text-sm text-red-500 mt-1">{error}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Table Container - Fixed */}
                                    <div className="border border-gray-300 rounded-sm overflow-hidden w-full">
                                        {/* Table Content with Horizontal Scroll */}
                                        <div className="overflow-x-auto w-full">
                                            <Table className="w-full min-w-[600px]">
                                                <TableHeader>
                                                    <TableRow className="align-middle h-4">
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[100px]">Student ID</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[200px]">Profile & Name</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[120px] hidden sm:table-cell">Username</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[80px] hidden md:table-cell">Password</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[80px]">Role</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[100px] hidden lg:table-cell">Created Date</TableHead>
                                                        <TableHead className="whitespace-nowrap py-0 h-11 w-[100px]">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {users.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center py-2 text-gray-500">
                                                                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                                <p className="text-gray-600">No users created yet</p>
                                                                <p className="text-sm text-gray-500 mt-1">Create your first user account to get started</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : paginatedUsers.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center py-2 text-gray-500">
                                                                No users found matching your search.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        paginatedUsers.map((user) => (
                                                            <TableRow key={user.id} className="align-middle h-6">
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <span className="font-medium text-gray-700">{user.studentId}</span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage
                                                                                src={user.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.startsWith('https://')
                                                                                    ? user.profilePicture
                                                                                    : user.profilePicture
                                                                                        ? `/api/images/uploaded/${String(user.profilePicture)}`
                                                                                        : undefined}
                                                                                alt={user.fullName}
                                                                            />
                                                                            <AvatarFallback className="text-xs">
                                                                                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <span className="font-medium">{user.fullName}</span>
                                                                            <p className="text-xs text-gray-500 sm:hidden">@{user.username}</p>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2 hidden sm:table-cell">
                                                                    <span className="text-sm text-gray-700">@{user.username}</span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2 hidden md:table-cell">
                                                                    <span className="text-sm text-gray-500">••••••••</span>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2">
                                                                    <Badge
                                                                        className={`text-xs ${user.role === 'Student'
                                                                                ? 'bg-blue-200 text-blue-800 border-blue-300 hover:bg-blue-200'
                                                                                : 'bg-green-200 text-green-800 border-green-300 hover:bg-green-200'
                                                                            }`}
                                                                    >
                                                                        {user.role}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap py-2 hidden lg:table-cell">
                                                                    <span className="text-sm">
                                                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
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
                                                                            onClick={() => handleUserEdit(user)}
                                                                            className="bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white h-7 w-7 p-0"
                                                                            title="Edit User"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleUserDelete(user)}
                                                                            className="bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white h-7 w-7 p-0"
                                                                            title="Delete User"
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

                        {/* Edit User Dialog */}
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                        <Edit className="h-5 w-5" />
                                        <span>Edit User Account</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Update user account information and profile details.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {/* Profile Picture */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-profile-picture">Profile Picture</Label>
                                        <div className="space-y-2">
                                            <Input
                                                id="edit-profile-picture"
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
                                            {profilePicture && !uploading && (
                                                <div className="flex items-center space-x-2">
                                                    <Image
                                                        src={profilePictureS3Url || `/api/images/uploaded/${String(profilePicture)}`}
                                                        alt="Preview"
                                                        width={64}
                                                        height={64}
                                                        className="w-16 h-16 object-cover rounded border border-gray-200"
                                                    />
                                                    <span className="text-sm text-green-600">✓ Image uploaded successfully</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Student ID */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-student-id">Student ID *</Label>
                                        <Input
                                            id="edit-student-id"
                                            placeholder="Enter student ID"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                        />
                                    </div>

                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-full-name">Full Name *</Label>
                                        <Input
                                            id="edit-full-name"
                                            placeholder="Enter full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>

                                    {/* Username */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-username">Username *</Label>
                                        <Input
                                            id="edit-username"
                                            placeholder="Enter username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-password">New Password * (minimum 8 characters)</Label>
                                        <div className="relative">
                                            <Input
                                                id="edit-password"
                                                type={showEditPassword ? "text" : "password"}
                                                placeholder="Enter password (minimum 8 characters)"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowEditPassword(!showEditPassword)}
                                            >
                                                {showEditPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Password must be at least 8 characters long ({password.length}/8+)
                                        </p>
                                    </div>

                                    {/* Role */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-role">Role *</Label>
                                        <select
                                            id="edit-role"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as 'Student' | 'Instructor')}
                                        >
                                            <option value="Student">Student</option>
                                            <option value="Instructor">Instructor</option>
                                        </select>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUserUpdate}
                                        disabled={!studentId.trim() || !fullName.trim() || !username.trim() || !password.trim() || password.length < 8 || updating}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Update User Account"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogContent className="w-[95vw] max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                        <Trash2 className="h-5 w-5 text-red-600" />
                                        <span>Delete User Account</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. The user account and all associated data will be permanently deleted from the database.
                                    </DialogDescription>
                                </DialogHeader>

                                {userToDelete && (
                                    <div className="py-4">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage
                                                        src={userToDelete.profilePicture && typeof userToDelete.profilePicture === 'string' && userToDelete.profilePicture.startsWith('https://')
                                                            ? userToDelete.profilePicture
                                                            : userToDelete.profilePicture
                                                                ? `/api/images/uploaded/${String(userToDelete.profilePicture)}`
                                                                : undefined}
                                                        alt={userToDelete.fullName}
                                                    />
                                                    <AvatarFallback className="text-sm">
                                                        {userToDelete.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900">{userToDelete.fullName}</p>
                                                    <p className="text-sm text-gray-600">@{userToDelete.username}</p>
                                                    <p className="text-sm text-gray-500">ID: {userToDelete.studentId}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-4">
                                            Are you sure you want to permanently delete this user account? This will remove the user and all their exam history from the database permanently.
                                        </p>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={cancelDelete}
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={confirmDelete}
                                        disabled={deleting}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete User
                                            </>
                                        )}
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
