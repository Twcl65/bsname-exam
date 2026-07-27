"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'super-admin' | 'instructor' | 'student'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar: string
}

interface UserContextType {
    user: User | null
    login: (user: User) => void
    logout: () => void
    isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for stored user data on mount
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (error) {
                console.error('Error parsing stored user data:', error)
                localStorage.removeItem('user')
            }
        }
        setIsLoading(false)
    }, [])

    const login = (userData: User) => {
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
    }

    return (
        <UserContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
