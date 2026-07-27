// =============================================
// API Route: /api/users
// Methods: GET, POST
// =============================================

import { NextResponse } from 'next/server';
import pool, { generateId } from '@/lib/database';
import bcrypt from 'bcryptjs';

// GET - Fetch all users
export async function GET() {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                u.id,
                u.student_id,
                u.profile_picture,
                u.full_name,
                u.username,
                u.role,
                u.phone,
                u.is_active,
                u.last_login,
                u.last_seen,
                u.created_at,
                u.updated_at,
                s3.s3_url as profile_picture_s3_url
            FROM users u
            LEFT JOIN s3_images s3 ON u.profile_picture = s3.id
            ORDER BY u.created_at DESC
        `);

        const users = rows.map(user => ({
            id: user.id,
            studentId: user.student_id,
            profilePicture: user.profile_picture_s3_url || user.profile_picture,
            fullName: user.full_name,
            username: user.username,
            role: user.role,
            phone: user.phone,
            isActive: user.is_active,
            lastLogin: user.last_login ? new Date(user.last_login) : null,
            lastSeen: user.last_seen ? new Date(user.last_seen) : null,
            createdAt: new Date(user.created_at)
        }));

        return NextResponse.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST - Create a new user
export async function POST(request) {
    try {
        const requestBody = await request.json();
        console.log('Request body:', requestBody);
        
        // Extract values with fallbacks
        const studentId = requestBody.studentId;
        const fullName = requestBody.fullName;
        const username = requestBody.username;
        const password = requestBody.password;
        const role = requestBody.role || 'Student';
        const phone = requestBody.phone || '';
        const profilePicture = requestBody.profilePicture || '';
        
        console.log('Extracted values:', { studentId, fullName, username, role, phone, profilePicture });

        // Validation
        if (!studentId || !studentId.trim()) {
            return NextResponse.json(
                { success: false, error: 'Student ID is required' },
                { status: 400 }
            );
        }

        if (!fullName || !fullName.trim()) {
            return NextResponse.json(
                { success: false, error: 'Full name is required' },
                { status: 400 }
            );
        }

        if (!username || !username.trim()) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        if (!password || !password.trim()) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        if (password.trim().length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Check if student ID already exists
        const [existingStudentId] = await pool.execute(
            'SELECT id FROM users WHERE student_id = ?',
            [studentId.trim()]
        );

        if (existingStudentId.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Student ID already exists' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const [existingUsername] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username.trim()]
        );

        if (existingUsername.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

        const userId = generateId();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Insert user
            await connection.execute(
                'INSERT INTO users (id, student_id, profile_picture, full_name, username, password, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    userId, 
                    studentId.trim(), 
                    profilePicture.trim(), 
                    fullName.trim(), 
                    username.trim(), 
                    hashedPassword, 
                    role, 
                    phone.trim()
                ]
            );

            await connection.commit();

            // Fetch the created user (without password)
            const [newUser] = await pool.execute(`
                SELECT 
                    id,
                    student_id,
                    profile_picture,
                    full_name,
                    username,
                    role,
                    phone,
                    is_active,
                    created_at
                FROM users
                WHERE id = ?
            `, [userId]);

            const userData = {
                id: newUser[0].id,
                studentId: newUser[0].student_id,
                profilePicture: newUser[0].profile_picture,
                fullName: newUser[0].full_name,
                username: newUser[0].username,
                role: newUser[0].role,
                phone: newUser[0].phone,
                isActive: newUser[0].is_active,
                createdAt: new Date(newUser[0].created_at)
            };

            return NextResponse.json({
                success: true,
                data: userData,
                message: 'User created successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creating user:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to create user',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
