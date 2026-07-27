// =============================================
// API Route: /api/subjects
// Methods: GET, POST
// =============================================

import { NextResponse } from 'next/server';
import pool, { generateId } from '@/lib/database';

// GET - Fetch all subjects with their subtopics
export async function GET() {
    try {
        const [rows] = await pool.execute(`
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
                s.is_active,
                COUNT(st.id) as subtopic_count,
                (
                    SELECT COUNT(q.id) 
                    FROM questions q 
                    JOIN subtopics sub ON q.subtopic_id = sub.id 
                    WHERE sub.subject_id = s.id AND q.is_active = true AND q.deleted_at IS NULL
                ) as total_questions
            FROM subjects s
            LEFT JOIN subtopics st ON s.id = st.subject_id AND st.is_active = 1
            WHERE s.is_active = 1
            GROUP BY s.id, s.name, s.description, s.subject_time, s.exam_question_limit, s.subject_picture, s.subject_picture_s3_url, s.created_at, s.updated_at, s.is_active
            ORDER BY s.created_at DESC
        `);

        // Fetch subtopics for each subject
        const subjectsWithSubtopics = await Promise.all(
            rows.map(async (subject) => {
                const [subtopics] = await pool.execute(`
                    SELECT 
                        id, 
                        name, 
                        (SELECT COUNT(q.id) FROM questions q WHERE q.subtopic_id = subtopics.id AND q.is_active = true AND q.deleted_at IS NULL) as question_count, 
                        created_at
                    FROM subtopics 
                    WHERE subject_id = ? AND is_active = 1
                    ORDER BY created_at ASC
                `, [subject.id]);

                return {
                    ...subject,
                    subtopics: subtopics.map(st => ({
                        id: st.id,
                        name: st.name,
                        questionCount: st.question_count,
                        createdAt: new Date(st.created_at)
                    })),
                    createdAt: new Date(subject.created_at)
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: subjectsWithSubtopics
        });

    } catch (error) {
        console.error('Error fetching subjects:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subjects' },
            { status: 500 }
        );
    }
}

// POST - Create a new subject with subtopics
export async function POST(request) {
    try {
        const requestBody = await request.json();
        console.log('Request body:', requestBody);
        
        // Extract values with fallbacks
        const subjectName = requestBody.name;
        const subjectDescription = requestBody.description || '';
        const subjectTime = requestBody.subject_time || null;
        const examQuestionLimit = requestBody.exam_question_limit ? parseInt(requestBody.exam_question_limit) : 100;
        const subjectPicture = requestBody.subjectPicture || '';
        const subjectSubtopics = requestBody.subtopics || [];
        
        console.log('Extracted values:', { subjectName, subjectDescription, subjectPicture, subjectSubtopics, examQuestionLimit });

        if (!subjectName || !subjectName.trim()) {
            return NextResponse.json(
                { success: false, error: 'Subject name is required' },
                { status: 400 }
            );
        }

        const subjectId = generateId();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Insert subject
            await connection.execute(
                'INSERT INTO subjects (id, name, description, subject_time, exam_question_limit, subject_picture_s3_url) VALUES (?, ?, ?, ?, ?, ?)',
                [subjectId, subjectName.trim(), subjectDescription.trim(), subjectTime, examQuestionLimit, subjectPicture.trim()]
            );

            // Insert subtopics if any
            console.log('Checking subjectSubtopics:', subjectSubtopics, 'Type:', typeof subjectSubtopics, 'Is Array:', Array.isArray(subjectSubtopics));
            if (Array.isArray(subjectSubtopics) && subjectSubtopics.length > 0) {
                console.log('Processing subjectSubtopics:', subjectSubtopics);
                const validSubtopics = subjectSubtopics.filter(st => st && st.name && st.name.trim());
                console.log('Valid subtopics:', validSubtopics);
                
                for (const subtopic of validSubtopics) {
                    const subtopicId = generateId();
                    await connection.execute(
                        'INSERT INTO subtopics (id, subject_id, name, question_count) VALUES (?, ?, ?, ?)',
                        [subtopicId, subjectId, subtopic.name.trim(), subtopic.questionCount || 0]
                    );
                }
            }

            await connection.commit();

            // Fetch the created subject with subtopics
            const [newSubject] = await pool.execute(`
                SELECT 
                    s.id,
                    s.name,
                    s.description,
                    s.subject_time,
                    s.exam_question_limit,
                    s.created_at,
                    s.updated_at,
                    s.is_active
                FROM subjects s
                WHERE s.id = ?
            `, [subjectId]);

            const [subtopics] = await pool.execute(`
                SELECT 
                    id, 
                    name, 
                    (SELECT COUNT(q.id) FROM questions q WHERE q.subtopic_id = subtopics.id AND q.is_active = true AND q.deleted_at IS NULL) as question_count, 
                    created_at
                FROM subtopics 
                WHERE subject_id = ? AND is_active = 1
                ORDER BY created_at ASC
            `, [subjectId]);

            const subjectData = {
                ...newSubject[0],
                subtopics: subtopics.map(st => ({
                    id: st.id,
                    name: st.name,
                    questionCount: st.question_count,
                    createdAt: new Date(st.created_at)
                })),
                createdAt: new Date(newSubject[0].created_at)
            };

            return NextResponse.json({
                success: true,
                data: subjectData,
                message: 'Subject created successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creating subject:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to create subject',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
