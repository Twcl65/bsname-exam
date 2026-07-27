// =============================================
// API Route: /api/users/[id]
// Methods: GET, PUT, DELETE
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';

// GET - Fetch a specific user by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const [rows] = await pool.execute(`
            SELECT 
                id,
                student_id,
                profile_picture,
                full_name,
                username,
                role,
                phone,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `, [id]);

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const user = rows[0];
        const userData = {
            id: user.id,
            studentId: user.student_id,
            profilePicture: user.profile_picture,
            fullName: user.full_name,
            username: user.username,
            role: user.role,
            phone: user.phone,
            isActive: user.is_active,
            lastLogin: user.last_login ? new Date(user.last_login) : null,
            createdAt: new Date(user.created_at)
        };

        return NextResponse.json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT - Update a specific user
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const requestBody = await request.json();
        console.log('Update request body:', requestBody);
        
        // Extract values with fallbacks
        const studentId = requestBody.studentId;
        const fullName = requestBody.fullName;
        const username = requestBody.username;
        const password = requestBody.password;
        const role = requestBody.role;
        const phone = requestBody.phone || '';
        const profilePicture = requestBody.profilePicture || '';
        
        console.log('Extracted update values:', { studentId, fullName, username, role, phone, profilePicture });

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

        // Check if user exists
        const [existingUser] = await pool.execute(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (existingUser.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if student ID already exists (excluding current user)
        const [existingStudentId] = await pool.execute(
            'SELECT id FROM users WHERE student_id = ? AND id != ?',
            [studentId.trim(), id]
        );

        if (existingStudentId.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Student ID already exists' },
                { status: 400 }
            );
        }

        // Check if username already exists (excluding current user)
        const [existingUsername] = await pool.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username.trim(), id]
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

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Update user
            await connection.execute(
                'UPDATE users SET student_id = ?, profile_picture = ?, full_name = ?, username = ?, password = ?, role = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [
                    studentId.trim(), 
                    profilePicture.trim(), 
                    fullName.trim(), 
                    username.trim(), 
                    hashedPassword, 
                    role, 
                    phone.trim(),
                    id
                ]
            );

            await connection.commit();

            // Fetch the updated user (without password)
            const [updatedUser] = await pool.execute(`
                SELECT 
                    id,
                    student_id,
                    profile_picture,
                    full_name,
                    username,
                    role,
                    phone,
                    is_active,
                    created_at,
                    updated_at
                FROM users
                WHERE id = ?
            `, [id]);

            const userData = {
                id: updatedUser[0].id,
                studentId: updatedUser[0].student_id,
                profilePicture: updatedUser[0].profile_picture,
                fullName: updatedUser[0].full_name,
                username: updatedUser[0].username,
                role: updatedUser[0].role,
                phone: updatedUser[0].phone,
                isActive: updatedUser[0].is_active,
                createdAt: new Date(updatedUser[0].created_at),
                updatedAt: new Date(updatedUser[0].updated_at)
            };

            return NextResponse.json({
                success: true,
                data: userData,
                message: 'User updated successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error updating user:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to update user',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

// DELETE - Hard delete a specific user from database
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Check if user exists
        const [existingUser] = await pool.execute(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (existingUser.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Hard delete user from database
        // Note: exam_history records will be automatically deleted due to CASCADE constraint
        await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        return NextResponse.json({
            success: true,
            message: 'User permanently deleted from database'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to delete user',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
