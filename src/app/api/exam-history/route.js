import pool from '@/lib/database';

// POST - Save exam history
export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Received exam history data:', body)
    
    const { 
      userId, 
      subjectId, 
      examId, 
      difficultyLevel, 
      totalQuestions, 
      correctAnswers, 
      scorePercentage, 
      timeTaken, 
      userAnswers 
    } = body

    // Validate required fields
    if (!userId || !subjectId || !examId || !difficultyLevel || 
        totalQuestions === undefined || correctAnswers === undefined || 
        scorePercentage === undefined) {
      return Response.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Generate UUID for the exam history record
    const examHistoryId = crypto.randomUUID()
    console.log('Generated exam history ID:', examHistoryId)

    // Insert exam history record
    const insertQuery = `
      INSERT INTO exam_history (
        id, user_id, subject_id, exam_id, difficulty_level, total_questions, 
        correct_answers, score_percentage, time_taken, user_answers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const queryParams = [
      examHistoryId,
      userId,
      subjectId,
      examId,
      difficultyLevel,
      totalQuestions,
      correctAnswers,
      scorePercentage,
      timeTaken || null,
      userAnswers ? JSON.stringify(userAnswers) : null
    ]
    
    console.log('Executing query with params:', queryParams)

    const [result] = await pool.execute(insertQuery, queryParams)
    console.log('Query result:', result)

    return Response.json({
      success: true,
      message: 'Exam history saved successfully',
      data: {
        id: examHistoryId,
        userId,
        subjectId,
        examId,
        scorePercentage
      }
    })

  } catch (error) {
    console.error('Error saving exam history:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    })
    return Response.json({
      success: false,
      error: 'Failed to save exam history',
      details: error.message
    }, { status: 500 })
  }
}

// GET - Retrieve exam history for a user or all exam history for analytics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const subjectId = searchParams.get('subjectId')
    const all = searchParams.get('all') // New parameter to get all exam history
    const limit = searchParams.get('limit') || 50
    const offset = searchParams.get('offset') || 0

    // If 'all' parameter is true, get all exam history for analytics
    if (all === 'true') {
      let query = `SELECT 
        eh.*,
        s.name as subject_name,
        s.description as subject_description
      FROM exam_history eh
      LEFT JOIN subjects s ON eh.subject_id = s.id
      ORDER BY eh.created_at DESC`
      
      if (limit && limit !== '0') {
        query += ` LIMIT ${parseInt(limit)}`
      }
      
      const [rows] = await pool.execute(query)
      
      const examHistory = rows.map(row => ({
        ...row,
        user_answers: row.user_answers // JSON field is already parsed by MySQL
      }))

      return Response.json({
        success: true,
        data: examHistory
      })
    }

    if (!userId) {
      return Response.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    let query = `SELECT 
      eh.*,
      s.name as subject_name,
      s.description as subject_description
    FROM exam_history eh
    LEFT JOIN subjects s ON eh.subject_id = s.id
    WHERE eh.user_id = '${userId}'`
    
    if (subjectId) {
      query += ` AND eh.subject_id = '${subjectId}'`
    }

    query += ` ORDER BY eh.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`

    const [rows] = await pool.execute(query)

    // JSON fields are already parsed by MySQL
    const examHistory = rows.map(row => ({
      ...row,
      user_answers: row.user_answers // JSON field is already parsed by MySQL
    }))

    return Response.json({
      success: true,
      data: examHistory
    })

  } catch (error) {
    console.error('Error fetching exam history:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch exam history'
    }, { status: 500 })
  }
}
