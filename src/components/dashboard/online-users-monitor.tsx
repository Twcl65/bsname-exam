"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Wifi, WifiOff, Clock } from "lucide-react"
import { useState, useEffect } from "react"

interface OnlineUser {
    id: string
    name: string
    email: string
    role: string
    lastSeen: Date
    status: 'online' | 'away' | 'offline'
    avatar?: string
}

export function OnlineUsersMonitor() {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [lastUpdate, setLastUpdate] = useState(new Date())

    // Mock data - in a real app, this would come from your backend
    useEffect(() => {
        const mockUsers: OnlineUser[] = [
            {
                id: "1",
                name: "John Smith",
                email: "john.smith@marinex.com",
                role: "Student",
                lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
                status: "online"
            },
            {
                id: "2",
                name: "Sarah Johnson",
                email: "sarah.johnson@marinex.com",
                role: "Instructor",
                lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                status: "online"
            },
            {
                id: "3",
                name: "Mike Chen",
                email: "mike.chen@marinex.com",
                role: "Student",
                lastSeen: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
                status: "away"
            },
            {
                id: "4",
                name: "Emily Davis",
                email: "emily.davis@marinex.com",
                role: "Student",
                lastSeen: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
                status: "online"
            },
            {
                id: "5",
                name: "Robert Wilson",
                email: "robert.wilson@marinex.com",
                role: "Instructor",
                lastSeen: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
                status: "online"
            },
            {
                id: "6",
                name: "Lisa Brown",
                email: "lisa.brown@marinex.com",
                role: "Student",
                lastSeen: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
                status: "away"
            }
        ]

        setOnlineUsers(mockUsers)

        // Update every 30 seconds
        const interval = setInterval(() => {
            setLastUpdate(new Date())
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <Wifi className="h-3 w-3 text-green-500" />
            case 'away':
                return <Clock className="h-3 w-3 text-yellow-500" />
            default:
                return <WifiOff className="h-3 w-3 text-gray-400" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'online':
                return <Badge variant="default" className="bg-green-500 text-white">Online</Badge>
            case 'away':
                return <Badge variant="secondary" className="bg-yellow-500 text-white">Away</Badge>
            default:
                return <Badge variant="outline">Offline</Badge>
        }
    }

    const formatLastSeen = (date: Date) => {
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return "Just now"
        if (diffInMinutes === 1) return "1 minute ago"
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours === 1) return "1 hour ago"
        return `${diffInHours} hours ago`
    }

    const onlineCount = onlineUsers.filter(user => user.status === 'online').length
    const awayCount = onlineUsers.filter(user => user.status === 'away').length

    return (
        <Card className="border-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-primary">Online Users Monitor</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated {formatLastSeen(lastUpdate)}</span>
                    </div>
                </div>
                <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{onlineCount} Online</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">{awayCount} Away</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className="font-medium">{user.name}</p>
                                        {getStatusIcon(user.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user.role} • {formatLastSeen(user.lastSeen)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                {getStatusBadge(user.status)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
