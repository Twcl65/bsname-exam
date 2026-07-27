import pool from '@/lib/database';

export async function POST() {
  try {
    // Drop table if exists to start fresh
    await pool.execute('DROP TABLE IF EXISTS questions')

    // Create questions table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid()::text),
        subtopic_id VARCHAR(36) NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_image_s3_url VARCHAR(500) DEFAULT NULL,
        option_a_text TEXT NOT NULL,
        option_a_image_s3_url VARCHAR(500) DEFAULT NULL,
        option_b_text TEXT NOT NULL,
        option_b_image_s3_url VARCHAR(500) DEFAULT NULL,
        option_c_text TEXT NOT NULL,
        option_c_image_s3_url VARCHAR(500) DEFAULT NULL,
        option_d_text TEXT NOT NULL,
        option_d_image_s3_url VARCHAR(500) DEFAULT NULL,
        correct_answer VARCHAR(10) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
        explanation TEXT DEFAULT NULL,
        difficulty_level VARCHAR(50) DEFAULT 'Medium' CHECK (LOWER(difficulty_level) IN ('easy', 'medium', 'hard')),
        points INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `

    await pool.execute(createTableQuery)
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_questions_subtopic_id ON questions(subtopic_id)')
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_level)')
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at)')
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active)')

    // Drop exam_history table if exists to recreate without foreign keys
    await pool.execute('DROP TABLE IF EXISTS exam_history')

    // Create exam_history table
    const createExamHistoryTableQuery = `
      CREATE TABLE IF NOT EXISTS exam_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid()::text),
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        exam_id VARCHAR(36) NOT NULL,
        difficulty_level VARCHAR(50) NOT NULL CHECK (LOWER(difficulty_level) IN ('easy', 'medium', 'hard')),
        total_questions INT NOT NULL,
        correct_answers INT NOT NULL,
        score_percentage DECIMAL(5,2) NOT NULL,
        time_taken INT DEFAULT NULL,
        user_answers JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await pool.execute(createExamHistoryTableQuery)
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON exam_history(user_id)')
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_exam_history_subject_id ON exam_history(subject_id)')
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_exam_history_created_at ON exam_history(created_at)')
    await pool.execute('CREATE INDEX IF NOT EXISTS idx_exam_history_score ON exam_history(score_percentage)')

    // Clear existing questions and insert sample questions
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0')
    await pool.execute('DELETE FROM questions')
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1')
    
    // Insert sample questions
    // Get actual subtopic IDs from the database
    const [subtopics] = await pool.execute('SELECT id FROM subtopics LIMIT 2')
    
    console.log('Found subtopics:', subtopics)
    console.log('Subtopic IDs:', subtopics.map(s => s.id))
    
    if (subtopics.length > 0) {
        const subtopicId1 = subtopics[0].id
        const subtopicId2 = subtopics.length > 1 ? subtopics[1].id : subtopics[0].id
        
        console.log('Using subtopic ID 1:', subtopicId1)
        console.log('Using subtopic ID 2:', subtopicId2)
        
        const sampleQuestions = [
          {
            subtopic_id: subtopicId1,
            question_text: 'What is the primary purpose of marine diesel engines?',
            option_a_text: 'To generate electricity',
            option_b_text: 'To provide propulsion for the vessel',
            option_c_text: 'To operate navigation equipment',
            option_d_text: 'To power air conditioning systems',
            correct_answer: 'B',
            explanation: 'Marine diesel engines are primarily used for vessel propulsion, converting fuel energy into mechanical energy to drive the propeller.',
            difficulty_level: 'Easy',
            points: 1
          },
          {
            subtopic_id: subtopicId1,
            question_text: 'Which component is essential for steam system operation?',
            option_a_text: 'Cooling fan',
            option_b_text: 'Boiler',
            option_c_text: 'Battery',
            option_d_text: 'Generator',
            correct_answer: 'B',
            explanation: 'A boiler is essential for generating steam in steam systems by heating water to its boiling point.',
            difficulty_level: 'Medium',
            points: 2
          },
          {
            subtopic_id: subtopicId2,
            question_text: 'What is celestial navigation primarily used for?',
            option_a_text: 'Weather prediction',
            option_b_text: 'Determining ship position using stars',
            option_c_text: 'Radio communication',
            option_d_text: 'Engine monitoring',
            correct_answer: 'B',
            explanation: 'Celestial navigation uses the positions of celestial bodies (stars, sun, moon) to determine the ship\'s position at sea.',
            difficulty_level: 'Hard',
            points: 3
          },
          {
            subtopic_id: subtopicId2,
            question_text: 'What does GPS stand for?',
            option_a_text: 'Global Positioning System',
            option_b_text: 'General Purpose System',
            option_c_text: 'Geographic Positioning Service',
            option_d_text: 'Global Power System',
            correct_answer: 'A',
            explanation: 'GPS stands for Global Positioning System, a satellite-based navigation system.',
            difficulty_level: 'Easy',
            points: 1
          }
        ]

      for (const question of sampleQuestions) {
        const insertQuery = `
          INSERT INTO questions (
            id, subtopic_id, question_text, option_a_text, option_b_text, 
            option_c_text, option_d_text, correct_answer, explanation, 
            difficulty_level, points
          ) VALUES (gen_random_uuid()::text, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        
        await pool.execute(insertQuery, [
          question.subtopic_id,
          question.question_text,
          question.option_a_text,
          question.option_b_text,
          question.option_c_text,
          question.option_d_text,
          question.correct_answer,
          question.explanation,
          question.difficulty_level,
          question.points
        ])
      }
    }

    return Response.json({
      success: true,
      message: 'Database initialized successfully with questions table'
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return Response.json({
      success: false,
      error: 'Failed to initialize database'
    }, { status: 500 })
  }
}
