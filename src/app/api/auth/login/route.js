// =============================================
// API Route: /api/auth/login
// Methods: POST
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';

// POST - Authenticate user login
export async function POST(request) {
    try {
        const requestBody = await request.json();
        const { username, password } = requestBody;
        
        console.log('Login attempt:', { username });

        // Validation
        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Find user by username
        const [rows] = await pool.execute(`
            SELECT 
                id,
                student_id,
                profile_picture,
                full_name,
                username,
                password,
                role,
                phone,
                is_active,
                last_login,
                created_at
            FROM users
            WHERE username = ? AND is_active = 1
        `, [username.trim()]);

        console.log('Database query result:', { 
            userFound: rows.length > 0, 
            username: rows.length > 0 ? rows[0].username : 'none',
            isActive: rows.length > 0 ? rows[0].is_active : 'none'
        });

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const user = rows[0];

        // Debug logging
        console.log('User found:', {
            id: user.id,
            username: user.username,
            role: user.role,
            is_active: user.is_active,
            password_length: user.password ? user.password.length : 0,
            password_start: user.password ? user.password.substring(0, 10) + '...' : 'null'
        });
        console.log('Password being compared:', password);
        console.log('Stored password hash:', user.password);

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        console.log('Password comparison result:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('❌ Password verification failed');
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Update last login timestamp
        await pool.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Return user data (without password)
        const userData = {
            id: user.id,
            studentId: user.student_id,
            profilePicture: user.profile_picture,
            fullName: user.full_name,
            username: user.username,
            role: user.role.toLowerCase().replace(' ', '-'), // Convert to lowercase with hyphens
            phone: user.phone,
            lastLogin: user.last_login ? new Date(user.last_login) : null,
            createdAt: new Date(user.created_at)
        };

        return NextResponse.json({
            success: true,
            data: userData,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific database connection errors
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return NextResponse.json(
                { success: false, error: 'Database connection failed. Please try again.' },
                { status: 503 }
            );
        }
        
        // Handle other database errors
        if (error.code && error.code.startsWith('ER_')) {
            return NextResponse.json(
                { success: false, error: 'Database error occurred. Please contact support.' },
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { success: false, error: 'Login failed. Please try again.' },
            { status: 500 }
        );
    }
}
