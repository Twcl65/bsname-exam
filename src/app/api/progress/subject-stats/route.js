// =============================================
// API Route: /api/progress/subject-stats
// Methods: GET
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET - Get subject progress statistics
export async function GET() {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                s.id,
                s.name,
                s.description,
                s.subject_picture,
                COUNT(DISTINCT eh.user_id) as unique_students,
                COUNT(eh.id) as total_exams,
                COALESCE(AVG(eh.correct_answers), 0) as average_correct,
                COALESCE(MAX(eh.correct_answers), 0) as highest_correct,
                COALESCE(MIN(eh.correct_answers), 0) as lowest_correct,
                COALESCE(AVG(eh.total_questions), 0) as average_total,
                COALESCE(MAX(eh.total_questions), 0) as highest_total,
                COALESCE(MIN(eh.total_questions), 0) as lowest_total
            FROM subjects s
            LEFT JOIN exam_history eh ON s.id = eh.subject_id
            WHERE s.is_active = 1
            GROUP BY s.id, s.name, s.description, s.subject_picture
            ORDER BY s.name ASC
        `);

        const subjectStats = rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            subjectPicture: row.subject_picture,
            uniqueStudents: parseInt(row.unique_students),
            totalExams: parseInt(row.total_exams),
            averageScore: `${Math.round(row.average_correct)}/${Math.round(row.average_total)}`,
            highestScore: `${Math.round(row.highest_correct)}/${Math.round(row.highest_total)}`,
            lowestScore: `${Math.round(row.lowest_correct)}/${Math.round(row.lowest_total)}`
        }));

        return NextResponse.json({
            success: true,
            data: subjectStats
        });

    } catch (error) {
        console.error('Error fetching subject progress stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subject progress stats' },
            { status: 500 }
        );
    }
}
