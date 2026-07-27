import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';

// GET - Retrieve user profile details
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

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
                u.created_at,
                s3.s3_url as profile_picture_s3_url
            FROM users u
            LEFT JOIN s3_images s3 ON u.profile_picture = s3.id
            WHERE u.id = ?
        `, [userId]);

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
            profilePictureUrl: user.profile_picture_s3_url || null,
            fullName: user.full_name,
            username: user.username,
            role: user.role,
            phone: user.phone || '',
            isActive: user.is_active,
            lastLogin: user.last_login ? new Date(user.last_login) : null,
            createdAt: new Date(user.created_at)
        };

        return NextResponse.json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}

// PUT - Update user profile (profile picture, phone, full name, and/or password)
export async function PUT(request) {
    try {
        const requestBody = await request.json();
        const { 
            userId, 
            fullName, 
            phone, 
            profilePicture, 
            currentPassword, 
            newPassword 
        } = requestBody;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!fullName || !fullName.trim()) {
            return NextResponse.json(
                { success: false, error: 'Full name is required' },
                { status: 400 }
            );
        }

        // Fetch current user from database
        const [existingUserRows] = await pool.execute(
            'SELECT password, role FROM users WHERE id = ?',
            [userId]
        );

        if (existingUserRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const existingUser = existingUserRows[0];
        let hashedPassword = null;

        // If trying to change password
        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword) {
                return NextResponse.json(
                    { success: false, error: 'Current password is required to set a new password' },
                    { status: 400 }
                );
            }

            if (newPassword.trim().length < 8) {
                return NextResponse.json(
                    { success: false, error: 'New password must be at least 8 characters long' },
                    { status: 400 }
                );
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { success: false, error: 'Invalid current password' },
                    { status: 401 }
                );
            }

            // Hash new password
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(newPassword.trim(), saltRounds);
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (hashedPassword) {
                await connection.execute(
                    'UPDATE users SET full_name = ?, phone = ?, profile_picture = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [
                        fullName.trim(),
                        phone ? phone.trim() : '',
                        profilePicture || null,
                        hashedPassword,
                        userId
                    ]
                );
            } else {
                await connection.execute(
                    'UPDATE users SET full_name = ?, phone = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [
                        fullName.trim(),
                        phone ? phone.trim() : '',
                        profilePicture || null,
                        userId
                    ]
                );
            }

            await connection.commit();

            // Fetch the updated user profile
            const [updatedUserRows] = await pool.execute(`
                SELECT 
                    u.id,
                    u.student_id,
                    u.profile_picture,
                    u.full_name,
                    u.username,
                    u.role,
                    u.phone,
                    u.is_active,
                    u.created_at,
                    s3.s3_url as profile_picture_s3_url
                FROM users u
                LEFT JOIN s3_images s3 ON u.profile_picture = s3.id
                WHERE u.id = ?
            `, [userId]);

            const updatedUser = updatedUserRows[0];
            const userData = {
                id: updatedUser.id,
                studentId: updatedUser.student_id,
                profilePicture: updatedUser.profile_picture,
                profilePictureUrl: updatedUser.profile_picture_s3_url || null,
                fullName: updatedUser.full_name,
                username: updatedUser.username,
                role: updatedUser.role,
                phone: updatedUser.phone || '',
                isActive: updatedUser.is_active,
                createdAt: new Date(updatedUser.created_at)
            };

            return NextResponse.json({
                success: true,
                data: userData,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
