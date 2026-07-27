// =============================================
// API Route: /api/users/status
// Methods: POST
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function POST(request) {
    try {
        const requestBody = await request.json();
        const { userId } = requestBody;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Update last_seen in users table
        await pool.execute(
            'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );

        return NextResponse.json({
            success: true,
            message: 'User status updated successfully'
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user status' },
            { status: 500 }
        );
    }
}
