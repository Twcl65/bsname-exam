// =============================================
// API Route: /api/progress/subject-users
// Methods: GET
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET - Get users who have taken exams for a specific subject
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subjectId');

        if (!subjectId) {
            return NextResponse.json(
                { success: false, error: 'Subject ID is required' },
                { status: 400 }
            );
        }

        const [rows] = await pool.execute(`
            SELECT DISTINCT
                u.id,
                u.student_id,
                u.full_name,
                u.username,
                u.profile_picture,
                COUNT(eh.id) as exam_count,
                COALESCE(AVG(eh.correct_answers), 0) as average_correct,
                COALESCE(MAX(eh.correct_answers), 0) as best_correct,
                COALESCE(MIN(eh.correct_answers), 0) as worst_correct,
                COALESCE(AVG(eh.total_questions), 0) as average_total,
                COALESCE(MAX(eh.total_questions), 0) as best_total,
                COALESCE(MIN(eh.total_questions), 0) as worst_total,
                MAX(eh.created_at) as last_exam_date
            FROM users u
            INNER JOIN exam_history eh ON u.id = eh.user_id
            WHERE eh.subject_id = ? AND u.is_active = 1
            GROUP BY u.id, u.student_id, u.full_name, u.username, u.profile_picture
            ORDER BY average_correct DESC, exam_count DESC
        `, [subjectId]);

        const users = rows.map(row => ({
            id: row.id,
            studentId: row.student_id,
            fullName: row.full_name,
            username: row.username,
            profilePicture: row.profile_picture,
            examCount: parseInt(row.exam_count),
            averageScore: `${Math.round(row.average_correct)}/${Math.round(row.average_total)}`,
            bestScore: `${Math.round(row.best_correct)}/${Math.round(row.best_total)}`,
            worstScore: `${Math.round(row.worst_correct)}/${Math.round(row.worst_total)}`,
            lastExamDate: row.last_exam_date ? new Date(row.last_exam_date).toISOString() : new Date().toISOString()
        }));

        return NextResponse.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Error fetching subject users:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            stack: error.stack
        });
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fetch subject users',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
