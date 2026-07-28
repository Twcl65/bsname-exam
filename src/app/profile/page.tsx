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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/UserContext"
import {
    User,
    Mail,
    Lock,
    KeyRound,
    Clock,
    Calendar,
    Camera,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    GraduationCap,
    Shield,
    Eye,
    EyeOff
} from "lucide-react"

interface ProfileData {
    id: string
    studentId: string
    profilePicture: string | null
    profilePictureUrl: string | null
    fullName: string
    username: string
    role: string
    phone: string
    isActive: boolean
    lastLogin: string | null
    createdAt: string
}

export default function ProfilePage() {
    const { user, login } = useUser()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Data states
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [profilePicture, setProfilePicture] = useState("")
    const [profilePictureUrl, setProfilePictureUrl] = useState("")

    // Password states
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    // Status states
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    // Notification states
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState("")

    // Fetch profile details on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return
            try {
                setLoading(true)
                const res = await fetch(`/api/profile?userId=${user.id}`)
                const result = await res.json()
                if (result.success) {
                    const data = result.data as ProfileData
                    setProfile(data)
                    setFullName(data.fullName)
                    setPhone(data.phone || "")
                    setProfilePicture(data.profilePicture || "")
                    setProfilePictureUrl(data.profilePictureUrl || "")
                } else {
                    setErrorMsg(result.error || "Failed to load user profile")
                }
            } catch (err) {
                console.error("Error loading user profile:", err)
                setErrorMsg("An error occurred while loading profile details")
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [user?.id])

    // Handle Profile Picture Click & Upload
    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Image validation
        if (!file.type.startsWith('image/')) {
            setErrorMsg('Only image files are allowed')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('File size must be less than 5MB')
            return
        }

        setUploading(true)
        setErrorMsg("")
        setSuccessMsg("")

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()
            if (result.success) {
                setProfilePicture(result.imageId)
                setProfilePictureUrl(result.s3Url)
                setSuccessMsg('Image uploaded successfully! Click "Save Changes" to apply.')
            } else {
                setErrorMsg(result.error || 'Failed to upload image')
            }
        } catch (error) {
            console.error('Upload error:', error)
            setErrorMsg('An error occurred during file upload')
        } finally {
            setUploading(false)
        }
    }

    // Save profile settings
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName.trim()) {
            setErrorMsg("Full name is required")
            return
        }

        setSavingProfile(true)
        setErrorMsg("")
        setSuccessMsg("")

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    profilePicture: profilePicture || null
                }),
            })

            const result = await response.json()
            if (result.success) {
                setSuccessMsg("Profile settings updated successfully!")

                // Update react local context reactively
                login({
                    id: user!.id,
                    name: result.data.fullName,
                    email: user!.email,
                    role: user!.role,
                    avatar: result.data.profilePictureUrl || "/avatars/default.jpg"
                })

                // Update local profile state
                setProfile(prev => prev ? {
                    ...prev,
                    fullName: result.data.fullName,
                    phone: result.data.phone,
                    profilePicture: result.data.profilePicture,
                    profilePictureUrl: result.data.profilePictureUrl
                } : null)
            } else {
                setErrorMsg(result.error || "Failed to update profile settings")
            }
        } catch (err) {
            console.error(err)
            setErrorMsg("An error occurred while saving profile changes")
        } finally {
            setSavingProfile(false)
        }
    }

    // Change Password Handler
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentPassword) {
            setPasswordError("Current password is required")
            return
        }
        if (!newPassword) {
            setPasswordError("New password is required")
            return
        }
        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters long")
            return
        }

        setSavingPassword(true)
        setPasswordError("")
        setPasswordSuccess("")

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    profilePicture: profilePicture || null,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                }),
            })

            const result = await response.json()
            if (result.success) {
                setPasswordSuccess("Password updated successfully!")
                setCurrentPassword("")
                setNewPassword("")
            } else {
                setPasswordError(result.error || "Failed to change password")
            }
        } catch (err) {
            console.error(err)
            setPasswordError("An error occurred while updating the password")
        } finally {
            setSavingPassword(false)
        }
    }

    // Role badge renderer
    const renderRoleBadge = (role: string) => {
        switch (role?.toLowerCase().replace(' ', '-')) {
            case 'super-admin':
                return (
                    <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 flex items-center gap-1 w-fit">
                        <Shield className="w-3.5 h-3.5" /> Super Admin
                    </Badge>
                )
            case 'instructor':
                return (
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 flex items-center gap-1 w-fit">
                        <UserCheck className="w-3.5 h-3.5" /> Instructor
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 flex items-center gap-1 w-fit">
                        <GraduationCap className="w-3.5 h-3.5" /> Student
                    </Badge>
                )
        }
    }

    // Date formatting helper
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <ProtectedRoute>
            <SidebarProvider>
                <RoleBasedSidebar />
                <SidebarInset>
                    {/* Header */}
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard">
                                            Dashboard
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Profile Settings</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    {/* Main Content container */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6 lg:p-8 pt-0 mt-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">Loading profile details...</p>
                            </div>
                        ) : (
                            <div className="max-w-6xl mx-auto space-y-8">
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Account Settings</h1>
                                    <p className="text-muted-foreground text-xs">Manage your profile, picture, contact information and credentials.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* Left Column - Card showing photo and quick metadata */}
                                    <div className="lg:col-span-4 space-y-6">
                                        <Card className="overflow-hidden border border-gray-200/80 shadow-sm bg-white rounded-xl">
                                            {/* Decorative colored top block */}
                                            <div className="h-10 bg-white relative" />

                                            <CardContent className="pt-0 px-6 pb-6 relative flex flex-col items-center">
                                                {/* Profile Avatar with click-to-upload hover overlay */}
                                                <div className="-mt-14 relative group cursor-pointer w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center" onClick={triggerFileInput}>
                                                    <Avatar className="w-full h-full rounded-none">
                                                        <AvatarImage
                                                            src={profilePictureUrl || "/avatars/default.jpg"}
                                                            alt={fullName}
                                                            className="object-cover w-full h-full"
                                                        />
                                                        <AvatarFallback className="rounded-none text-2xl font-bold bg-muted text-muted-foreground">
                                                            {fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <Camera className="w-6 h-6 text-white mb-1" />
                                                        <span className="text-[10px] text-white font-semibold">Change Photo</span>
                                                    </div>

                                                    {/* Uploading Spinner */}
                                                    {uploading && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>

                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    disabled={uploading}
                                                />

                                                <div className="text-center mt-4 w-full">
                                                    <h2 className="text-xl font-bold text-gray-900 truncate">{fullName}</h2>
                                                    <p className="text-sm text-muted-foreground truncate mb-3">{profile?.username}</p>
                                                    <div className="flex justify-center mb-6">
                                                        {profile && renderRoleBadge(profile.role)}
                                                    </div>
                                                </div>

                                                <div className="w-full border-t border-gray-100 pt-4 space-y-3.5">
                                                    <div className="flex items-center justify-between text-xs font-medium">
                                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" /> Joined
                                                        </span>
                                                        <span className="text-gray-700">{formatDate(profile?.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs font-medium">
                                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" /> Last Login
                                                        </span>
                                                        <span className="text-gray-700 truncate max-w-[150px]" title={profile?.lastLogin || ''}>
                                                            {formatDate(profile?.lastLogin || undefined)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column - Account Settings Form */}
                                    <div className="lg:col-span-8 space-y-6">
                                        {/* Profile edit card */}
                                        <Card className="border border-gray-200/80 shadow-sm bg-white rounded-xl">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold">Profile Details</CardTitle>
                                                <CardDescription>Update your personal information and contact details.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                                    {errorMsg && (
                                                        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                                                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                            <span>{errorMsg}</span>
                                                        </div>
                                                    )}

                                                    {successMsg && (
                                                        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm">
                                                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                                            <span>{successMsg}</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name *</Label>
                                                            <div className="relative">
                                                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                                <Input
                                                                    id="fullName"
                                                                    value={fullName}
                                                                    onChange={(e) => setFullName(e.target.value)}
                                                                    className="pl-9 border-gray-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                                                                    placeholder="Your Full Name"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Student ID (Read-only)</Label>
                                                            <Input
                                                                value={profile?.studentId || "N/A"}
                                                                disabled
                                                                className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username / Email (Read-only)</Label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                                <Input
                                                                    value={profile?.username || ""}
                                                                    disabled
                                                                    className="pl-9 bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-2">
                                                        <Button
                                                            type="submit"
                                                            disabled={savingProfile || uploading}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 shadow-sm rounded-lg"
                                                        >
                                                            {savingProfile ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                    Saving Profile...
                                                                </>
                                                            ) : "Save Changes"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>

                                        {/* Security change password card */}
                                        <Card className="border border-gray-200/80 shadow-sm bg-white rounded-xl">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold">Password & Security</CardTitle>
                                                <CardDescription>Modify your credentials to secure your account.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <form onSubmit={handleChangePassword} className="space-y-6">
                                                    {passwordError && (
                                                        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                                                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                            <span>{passwordError}</span>
                                                        </div>
                                                    )}

                                                    {passwordSuccess && (
                                                        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm">
                                                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                                            <span>{passwordSuccess}</span>
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Password</Label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                id="currentPassword"
                                                                type={showCurrentPassword ? "text" : "password"}
                                                                value={currentPassword}
                                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                                className="pl-9 pr-10 border-gray-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                                                                placeholder="Enter current password"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            >
                                                                {showCurrentPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">New Password</Label>
                                                        <div className="relative">
                                                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                id="newPassword"
                                                                type={showNewPassword ? "text" : "password"}
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                className="pl-9 pr-10 border-gray-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                                                                placeholder="At least 8 characters"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                            >
                                                                {showNewPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-2">
                                                        <Button
                                                            type="submit"
                                                            disabled={savingPassword}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 shadow-sm rounded-lg"
                                                        >
                                                            {savingPassword ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                    Changing Password...
                                                                </>
                                                            ) : "Update Password"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
