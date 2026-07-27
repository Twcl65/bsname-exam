import pool from '@/lib/database';

// GET - Fetch a single question by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const [rows] = await pool.execute(`
      SELECT 
        q.id,
        q.question_text,
        q.question_image_s3_url as question_image,
        q.option_a_text,
        q.option_a_image_s3_url as option_a_image,
        q.option_b_text,
        q.option_b_image_s3_url as option_b_image,
        q.option_c_text,
        q.option_c_image_s3_url as option_c_image,
        q.option_d_text,
        q.option_d_image_s3_url as option_d_image,
        q.correct_answer,
        q.explanation,
        q.difficulty_level,
        q.points,
        q.created_at,
        q.updated_at,
        s.id as subject_id,
        s.name as subject_name,
        st.id as subtopic_id,
        st.name as subtopic_name
      FROM questions q
      JOIN subtopics st ON q.subtopic_id = st.id
      JOIN subjects s ON st.subject_id = s.id
      WHERE q.id = ? AND q.deleted_at IS NULL
    `, [id])

    if (rows.length === 0) {
      return Response.json({
        success: false,
        error: 'Question not found'
      }, { status: 404 })
    }

    const question = rows[0]

    // Convert date strings to Date objects
    const questionWithDates = {
      ...question,
      createdAt: new Date(question.created_at),
      updatedAt: new Date(question.updated_at)
    }

    return Response.json({
      success: true,
      data: questionWithDates
    })
  } catch (error) {
    console.error('Error fetching question:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch question'
    }, { status: 500 })
  }
}

// PUT - Update a question
export async function PUT(request, { params }) {
  try {
    const { id } = await params
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
        error: 'Correct answer must be A, B, C, or D'
      }, { status: 400 })
    }

    // Check if subtopic exists
    const [subtopicCheck] = await pool.execute(
      'SELECT id FROM subtopics WHERE id = ?',
      [subtopicId]
    )

    if (subtopicCheck.length === 0) {
      return Response.json({
        success: false,
        error: 'Invalid subtopic ID'
      }, { status: 400 })
    }

    // Check if question exists
    const [questionCheck] = await pool.execute(
      'SELECT id FROM questions WHERE id = ? AND deleted_at IS NULL',
      [id]
    )

    if (questionCheck.length === 0) {
      return Response.json({
        success: false,
        error: 'Question not found'
      }, { status: 404 })
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

    // Update the question
    await pool.execute(`
      UPDATE questions 
      SET 
        subtopic_id = ?,
        question_text = ?,
        question_image_s3_url = ?,
        option_a_text = ?,
        option_a_image_s3_url = ?,
        option_b_text = ?,
        option_b_image_s3_url = ?,
        option_c_text = ?,
        option_c_image_s3_url = ?,
        option_d_text = ?,
        option_d_image_s3_url = ?,
        correct_answer = ?,
        explanation = ?,
        difficulty_level = ?,
        points = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      subtopicId,
      questionText || null,
      questionImageS3Url,
      optionAText || null,
      optionAImageS3Url,
      optionBText || null,
      optionBImageS3Url,
      optionCText || null,
      optionCImageS3Url,
      optionDText || null,
      optionDImageS3Url,
      correctAnswer,
      explanation || null,
      difficultyLevel,
      points,
      id
    ])

    return Response.json({
      success: true,
      message: 'Question updated successfully'
    })
  } catch (error) {
    console.error('Error updating question:', error)
    return Response.json({
      success: false,
      error: 'Failed to update question'
    }, { status: 500 })
  }
}

// DELETE - Soft delete a question
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Check if question exists
    const [questionCheck] = await pool.execute(
      'SELECT id FROM questions WHERE id = ? AND deleted_at IS NULL',
      [id]
    )

    if (questionCheck.length === 0) {
      return Response.json({
        success: false,
        error: 'Question not found'
      }, { status: 404 })
    }

    // Soft delete the question
    await pool.execute(
      'UPDATE questions SET deleted_at = NOW() WHERE id = ?',
      [id]
    )

    return Response.json({
      success: true,
      message: 'Question deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting question:', error)
    return Response.json({
      success: false,
      error: 'Failed to delete question'
    }, { status: 500 })
  }
}
