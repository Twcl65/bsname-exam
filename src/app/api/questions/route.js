import pool from '@/lib/database';
import { randomUUID } from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const subtopicId = searchParams.get('subtopic_id')
    const subjectId = searchParams.get('subject_id')

    let query = `
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
        eq.created_at,
        eq.updated_at,
        st.name as subtopic_name,
        st.subject_id,
        s.name as subject_name
      FROM questions eq
      JOIN subtopics st ON eq.subtopic_id = st.id
      JOIN subjects s ON st.subject_id = s.id
      WHERE eq.is_active = TRUE AND eq.deleted_at IS NULL
    `
    
    const params = []
    
    if (subtopicId) {
      query += ' AND eq.subtopic_id = ?'
      params.push(subtopicId)
    } else if (subjectId) {
      query += ' AND st.subject_id = ?'
      params.push(subjectId)
    }
    
    query += ' ORDER BY eq.created_at DESC'

    const [rows] = await pool.execute(query, params)
    
    // Convert date strings to Date objects
    const questionsWithDates = rows.map(question => ({
      ...question,
      createdAt: new Date(question.created_at),
      updatedAt: new Date(question.updated_at)
    }))
    
    return Response.json({
      success: true,
      data: questionsWithDates
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch questions'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      subtopicId,
      questionText,
      questionImage,
      optionAText,
      optionAImage,
      optionBText,
      optionBImage,
      optionCText,
      optionCImage,
      optionDText,
      optionDImage,
      correctAnswer,
      explanation,
      difficultyLevel = 'Medium',
      points = 1
    } = body

    // Validate required fields
    if (!subtopicId || !correctAnswer) {
      return Response.json({
        success: false,
        error: 'Missing required fields: subtopicId and correctAnswer are required'
      }, { status: 400 })
    }

    // Validate question has either text or image
    if ((!questionText || questionText.trim() === "") && !questionImage) {
      return Response.json({
        success: false,
        error: 'Question must have either text or image'
      }, { status: 400 })
    }

    // Validate all options have either text or image
    const missingOptions = []
    if ((!optionAText || optionAText.trim() === "") && !optionAImage) missingOptions.push('Option A')
    if ((!optionBText || optionBText.trim() === "") && !optionBImage) missingOptions.push('Option B')
    if ((!optionCText || optionCText.trim() === "") && !optionCImage) missingOptions.push('Option C')
    if ((!optionDText || optionDText.trim() === "") && !optionDImage) missingOptions.push('Option D')
    
    if (missingOptions.length > 0) {
      return Response.json({
        success: false,
        error: `Missing content for: ${missingOptions.join(', ')}`
      }, { status: 400 })
    }

    // Validate correct answer
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return Response.json({
        success: false,
        error: 'Invalid correct answer'
      }, { status: 400 })
    }

    // Check if subtopic exists
    const [subtopicCheck] = await pool.execute('SELECT id, name, subject_id FROM subtopics WHERE id = ?', [subtopicId])
    if (subtopicCheck.length === 0) {
      return Response.json({
        success: false,
        error: `Subtopic with ID '${subtopicId}' does not exist`
      }, { status: 400 })
    }

    // Convert image IDs to S3 URLs if they exist
    const getS3Url = async (imageId) => {
      if (!imageId) return null;
      
      // If it's already an S3 URL, return as is
      if (imageId.startsWith('https://')) {
        return imageId;
      }
      
      // Look up S3 URL from s3_images table
      try {
        const [rows] = await pool.execute('SELECT s3_url FROM s3_images WHERE id = ?', [imageId]);
        return rows.length > 0 ? rows[0].s3_url : null;
      } catch (error) {
        console.error('Error looking up S3 URL:', error);
        return null;
      }
    };

    const questionImageS3Url = await getS3Url(questionImage);
    const optionAImageS3Url = await getS3Url(optionAImage);
    const optionBImageS3Url = await getS3Url(optionBImage);
    const optionCImageS3Url = await getS3Url(optionCImage);
    const optionDImageS3Url = await getS3Url(optionDImage);

    // Generate UUID for the question
    const questionId = randomUUID()

    const query = `
      INSERT INTO questions (
        id, subtopic_id, question_text, question_image_s3_url,
        option_a_text, option_a_image_s3_url,
        option_b_text, option_b_image_s3_url,
        option_c_text, option_c_image_s3_url,
        option_d_text, option_d_image_s3_url,
        correct_answer, explanation, difficulty_level, points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      questionId,
      subtopicId,
      questionText,
      questionImageS3Url,
      optionAText,
      optionAImageS3Url,
      optionBText,
      optionBImageS3Url,
      optionCText,
      optionCImageS3Url,
      optionDText,
      optionDImageS3Url,
      correctAnswer,
      explanation || null,
      difficultyLevel,
      points
    ]

    await pool.execute(query, params)

    // Fetch the created question
    const [newQuestion] = await pool.execute(`
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
        eq.created_at,
        eq.updated_at,
        st.name as subtopic_name,
        s.name as subject_name
      FROM questions eq
      JOIN subtopics st ON eq.subtopic_id = st.id
      JOIN subjects s ON st.subject_id = s.id
      WHERE eq.id = ?
    `, [questionId])

    if (newQuestion.length === 0) {
      return Response.json({
        success: false,
        error: 'Failed to retrieve created question'
      }, { status: 500 })
    }

    const questionWithDates = {
      ...newQuestion[0],
      createdAt: new Date(newQuestion[0].created_at),
      updatedAt: new Date(newQuestion[0].updated_at)
    }

    return Response.json({
      success: true,
      data: questionWithDates
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating question:', error)
    return Response.json({
      success: false,
      error: 'Failed to create question'
    }, { status: 500 })
  }
}
