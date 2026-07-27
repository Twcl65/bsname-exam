// =============================================
// API Route: /api/subtopics/[id]
// Methods: PUT, DELETE
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

// PUT - Update a subtopic
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const { name, questionCount } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, error: 'Subtopic name is required' },
                { status: 400 }
            );
        }

        const [result] = await pool.execute(
            'UPDATE subtopics SET name = ?, question_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
            [name.trim(), questionCount || 0, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, error: 'Subtopic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Subtopic updated successfully'
        });

    } catch (error) {
        console.error('Error updating subtopic:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update subtopic' },
            { status: 500 }
        );
    }
}

// DELETE - Soft delete a subtopic
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        const [result] = await pool.execute(
            'UPDATE subtopics SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, error: 'Subtopic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Subtopic deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting subtopic:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete subtopic' },
            { status: 500 }
        );
    }
}
