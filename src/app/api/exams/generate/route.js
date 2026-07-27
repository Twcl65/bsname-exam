// =============================================
// API Route: /api/exams/generate
// Method: POST
// Description: Generate 100 random questions for a subject
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function POST(request) {
    try {
        const { subjectId, difficulty } = await request.json();

        if (!subjectId) {
            return NextResponse.json(
                { success: false, error: 'Subject ID is required' },
                { status: 400 }
            );
        }

        // First, get the subject's question limit
        const [subjectResult] = await pool.execute(`
            SELECT exam_question_limit FROM subjects WHERE id = ? AND is_active = 1
        `, [subjectId]);

        if (subjectResult.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Subject not found' },
                { status: 404 }
            );
        }

        const questionLimit = subjectResult[0].exam_question_limit || 100;

        // Next, check if the subject has enough questions for the selected difficulty
        const [totalQuestionsResult] = await pool.execute(`
            SELECT COUNT(eq.id) as total_questions
            FROM questions eq
            JOIN subtopics st ON eq.subtopic_id = st.id
            WHERE st.subject_id = ? AND eq.is_active = 1 AND LOWER(eq.difficulty_level) = LOWER(?)
        `, [subjectId, difficulty]);

        const totalQuestions = totalQuestionsResult[0].total_questions;

        if (totalQuestions < questionLimit) {
            return NextResponse.json({
                success: false,
                error: 'Insufficient questions',
                message: `This subject only has ${totalQuestions} ${difficulty.toLowerCase()} questions available. At least ${questionLimit} questions are required for an exam.`,
                availableQuestions: totalQuestions
            }, { status: 400 });
        }

        // Get subtopics for the subject
        const [subtopics] = await pool.execute(`
            SELECT id, name, question_count
            FROM subtopics 
            WHERE subject_id = ? AND is_active = 1
        `, [subjectId]);

        if (subtopics.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No subtopics found',
                message: 'This subject has no subtopics available.'
            }, { status: 400 });
        }

        // Calculate questions per subtopic (distribute 100 questions across subtopics)
        // const questionsPerSubtopic = Math.floor(100 / subtopics.length);

        // Get all available questions for the subject with matching difficulty
        const [allQuestions] = await pool.execute(`
            SELECT 
                eq.id,
                eq.subtopic_id,
                eq.question_text,
                eq.question_image_s3_url as question_image,
                eq.option_a_text,
                eq.option_a_image_s3_url as option_a_image,
                eq.option_b_text,
                eq.option_b_image_s3_url as option_b_image,
                eq.option_c_text,
                eq.option_c_image_s3_url as option_c_image,
                eq.option_d_text,
                eq.option_d_image_s3_url as option_d_image,
                eq.correct_answer,
                eq.explanation,
                eq.difficulty_level,
                eq.points,
                st.name as subtopic_name
            FROM questions eq
            JOIN subtopics st ON eq.subtopic_id = st.id
            WHERE st.subject_id = ? AND eq.is_active = 1 AND LOWER(eq.difficulty_level) = LOWER(?)
            ORDER BY RANDOM()
        `, [subjectId, difficulty]);

        // Select exactly the required number of unique questions
        const selectedQuestions = allQuestions.slice(0, questionLimit);

        // Shuffle the final questions array
        const shuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

        // Return the generated exam
        return NextResponse.json({
            success: true,
            data: {
                examId: `exam_${Date.now()}`,
                subjectId,
                difficulty,
                totalQuestions: shuffledQuestions.length,
                questions: shuffledQuestions.map(q => ({
                    id: q.id,
                    subtopicId: q.subtopic_id,
                    subtopicName: q.subtopic_name,
                    questionText: q.question_text,
                    questionImage: q.question_image || null,
                    optionA: q.option_a_text,
                    optionAImage: q.option_a_image || null,
                    optionB: q.option_b_text,
                    optionBImage: q.option_b_image || null,
                    optionC: q.option_c_text,
                    optionCImage: q.option_c_image || null,
                    optionD: q.option_d_text,
                    optionDImage: q.option_d_image || null,
                    correctAnswer: q.correct_answer,
                    explanation: q.explanation,
                    difficultyLevel: q.difficulty_level,
                    points: q.points
                })),
                timeLimit: 180, // 3 hours in minutes
                createdAt: new Date().toISOString()
            },
            message: 'Exam generated successfully'
        });

    } catch (error) {
        console.error('Error generating exam:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to generate exam',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
