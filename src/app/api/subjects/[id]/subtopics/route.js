// =============================================
// API Route: /api/subjects/[id]/subtopics
// Methods: GET, POST
// =============================================

import { NextResponse } from 'next/server';
import pool, { generateId } from '@/lib/database';

// GET - Fetch all subtopics for a subject
export async function GET(request, { params }) {
    try {
        const { id } = await params;

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

        const subtopicsData = subtopics.map(st => ({
            id: st.id,
            name: st.name,
            questionCount: st.question_count,
            createdAt: new Date(st.created_at)
        }));

        return NextResponse.json({
            success: true,
            data: subtopicsData
        });

    } catch (error) {
        console.error('Error fetching subtopics:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subtopics' },
            { status: 500 }
        );
    }
}

// POST - Add a new subtopic to a subject
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const { name, questionCount } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, error: 'Subtopic name is required' },
                { status: 400 }
            );
        }

        // Check if subject exists
        const [subjects] = await pool.execute(
            'SELECT id FROM subjects WHERE id = ? AND is_active = 1',
            [id]
        );

        if (subjects.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Subject not found' },
                { status: 404 }
            );
        }

        const subtopicId = generateId();
        await pool.execute(
            'INSERT INTO subtopics (id, subject_id, name, question_count) VALUES (?, ?, ?, ?)',
            [subtopicId, id, name.trim(), questionCount || 0]
        );

        const [newSubtopic] = await pool.execute(`
            SELECT 
                id, 
                name, 
                (SELECT COUNT(q.id) FROM questions q WHERE q.subtopic_id = subtopics.id AND q.is_active = true AND q.deleted_at IS NULL) as question_count, 
                created_at 
            FROM subtopics 
            WHERE id = ?
        `, [subtopicId]);

        const subtopicData = {
            id: newSubtopic[0].id,
            name: newSubtopic[0].name,
            questionCount: newSubtopic[0].question_count,
            createdAt: new Date(newSubtopic[0].created_at)
        };

        return NextResponse.json({
            success: true,
            data: subtopicData,
            message: 'Subtopic created successfully'
        });

    } catch (error) {
        console.error('Error creating subtopic:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create subtopic' },
            { status: 500 }
        );
    }
}
