// =============================================
// API Route: /api/subjects/[id]
// Methods: GET, PUT, DELETE
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET - Fetch a specific subject with its subtopics
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const [subjects] = await pool.execute(`
            SELECT 
                s.id,
                s.name,
                s.description,
                s.subject_time,
                s.exam_question_limit,
                s.subject_picture,
                s.subject_picture_s3_url,
                s.created_at,
                s.updated_at,
                s.is_active
            FROM subjects s
            WHERE s.id = ? AND s.is_active = 1
        `, [id]);

        if (subjects.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Subject not found' },
                { status: 404 }
            );
        }

        const [subtopics] = await pool.execute(`
            SELECT 
                id, 
                name, 
                (SELECT COUNT(q.id) FROM questions q WHERE q.subtopic_id = subtopics.id AND q.is_active = true AND q.deleted_at IS NULL) as question_count, 
                created_at
            FROM subtopics 
            WHERE subject_id = ? AND is_active = 1
            ORDER BY created_at ASC
        `, [id]);

        const subjectData = {
            ...subjects[0],
            subtopics: subtopics.map(st => ({
                id: st.id,
                name: st.name,
                questionCount: st.question_count,
                createdAt: new Date(st.created_at)
            })),
            createdAt: new Date(subjects[0].created_at)
        };

        return NextResponse.json({
            success: true,
            data: subjectData
        });

    } catch (error) {
        console.error('Error fetching subject:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subject' },
            { status: 500 }
        );
    }
}

// PUT - Update a subject
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const { name, description, subject_time, exam_question_limit, subjectPicture } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, error: 'Subject name is required' },
                { status: 400 }
            );
        }

        const [result] = await pool.execute(
            'UPDATE subjects SET name = ?, description = ?, subject_time = ?, exam_question_limit = ?, subject_picture_s3_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
            [name.trim(), description?.trim() || '', subject_time, exam_question_limit !== undefined ? parseInt(exam_question_limit) : 100, subjectPicture?.trim() || '', id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, error: 'Subject not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Subject updated successfully'
        });

    } catch (error) {
        console.error('Error updating subject:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update subject' },
            { status: 500 }
        );
    }
}

// DELETE - Soft delete a subject (and its subtopics)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Soft delete subtopics first
            await connection.execute(
                'UPDATE subtopics SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE subject_id = ?',
                [id]
            );

            // Soft delete subject
            const [result] = await connection.execute(
                'UPDATE subjects SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, error: 'Subject not found' },
                    { status: 404 }
                );
            }

            await connection.commit();

            return NextResponse.json({
                success: true,
                message: 'Subject deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error deleting subject:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete subject' },
            { status: 500 }
        );
    }
}
