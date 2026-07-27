// =============================================
// API Route: /api/progress/user-exam-history
// Methods: GET
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET - Get detailed exam history for a specific user
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const subjectId = searchParams.get('subjectId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        let query = `
            SELECT 
                eh.id,
                eh.exam_id,
                eh.difficulty_level,
                eh.total_questions,
                eh.correct_answers,
                eh.score_percentage,
                eh.time_taken,
                eh.created_at,
                s.name as subject_name,
                s.description as subject_description
            FROM exam_history eh
            LEFT JOIN subjects s ON eh.subject_id = s.id
            WHERE eh.user_id = ?
        `;
        
        const queryParams = [userId];

        if (subjectId) {
            query += ' AND eh.subject_id = ?';
            queryParams.push(subjectId);
        }

        query += ' ORDER BY eh.created_at DESC';

        const [rows] = await pool.execute(query, queryParams);

        const examHistory = rows.map(row => ({
            id: row.id,
            examId: row.exam_id,
            difficultyLevel: row.difficulty_level,
            totalQuestions: row.total_questions,
            correctAnswers: row.correct_answers,
            scorePercentage: `${row.correct_answers}/${row.total_questions}`,
            timeTaken: row.time_taken,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
            subjectName: row.subject_name,
            subjectDescription: row.subject_description
        }));

        // Get user information
        const [userRows] = await pool.execute(`
            SELECT 
                id,
                student_id,
                full_name,
                username,
                profile_picture
            FROM users
            WHERE id = ? AND is_active = 1
        `, [userId]);

        if (userRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const user = userRows[0];
        const userData = {
            id: user.id,
            studentId: user.student_id,
            fullName: user.full_name,
            username: user.username,
            profilePicture: user.profile_picture
        };

        return NextResponse.json({
            success: true,
            data: {
                user: userData,
                examHistory: examHistory
            }
        });

    } catch (error) {
        console.error('Error fetching user exam history:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user exam history' },
            { status: 500 }
        );
    }
}
