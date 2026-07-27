-- Supabase PostgreSQL Compatible SQL Dump
-- Generated for BSNAME Exam System
-- Compatible with PostgreSQL 13+

-- Enable uuid-ossp extension for UUID generation if needed (gen_random_uuid() is built-in for PG 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------

--
-- Table structure for table users
--

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  profile_picture VARCHAR(500) DEFAULT NULL,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Student' CHECK (role IN ('Student', 'Instructor', 'Super Admin')),
  phone VARCHAR(20) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_student_id ON users (student_id);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);
CREATE INDEX idx_users_created_at ON users (created_at);

-- --------------------------------------------------------

--
-- Table structure for table subjects
--

CREATE TABLE subjects (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  subject_time INT DEFAULT NULL,
  exam_question_limit INT DEFAULT 100,
  subject_picture VARCHAR(500) DEFAULT NULL,
  subject_picture_s3_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_subjects_name ON subjects (name);
CREATE INDEX idx_subjects_created_at ON subjects (created_at);
CREATE INDEX idx_subjects_is_active ON subjects (is_active);
CREATE INDEX idx_subjects_subject_picture_s3_url ON subjects (subject_picture_s3_url);

-- --------------------------------------------------------

--
-- Table structure for table subtopics
--

CREATE TABLE subtopics (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject_id VARCHAR(36) NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  question_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_subtopics_subject_id ON subtopics (subject_id);
CREATE INDEX idx_subtopics_name ON subtopics (name);
CREATE INDEX idx_subtopics_question_count ON subtopics (question_count);
CREATE INDEX idx_subtopics_is_active ON subtopics (is_active);

-- --------------------------------------------------------

--
-- Table structure for table questions
--

CREATE TABLE questions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subtopic_id VARCHAR(36) NOT NULL REFERENCES subtopics (id) ON DELETE CASCADE,
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
  deleted_at TIMESTAMP DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_questions_subtopic_id ON questions (subtopic_id);
CREATE INDEX idx_questions_difficulty ON questions (difficulty_level);
CREATE INDEX idx_questions_created_at ON questions (created_at);
CREATE INDEX idx_questions_is_active ON questions (is_active);
CREATE INDEX idx_questions_question_image_s3_url ON questions (question_image_s3_url);
CREATE INDEX idx_questions_option_a_image_s3_url ON questions (option_a_image_s3_url);
CREATE INDEX idx_questions_option_b_image_s3_url ON questions (option_b_image_s3_url);
CREATE INDEX idx_questions_option_c_image_s3_url ON questions (option_c_image_s3_url);
CREATE INDEX idx_questions_option_d_image_s3_url ON questions (option_d_image_s3_url);

-- --------------------------------------------------------

--
-- Table structure for table exam_history
--

CREATE TABLE exam_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject_id VARCHAR(36) NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  exam_id VARCHAR(36) NOT NULL,
  difficulty_level VARCHAR(50) NOT NULL CHECK (LOWER(difficulty_level) IN ('easy', 'medium', 'hard')),
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  time_taken INT DEFAULT NULL,
  user_answers JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_history_user_id ON exam_history (user_id);
CREATE INDEX idx_exam_history_subject_id ON exam_history (subject_id);
CREATE INDEX idx_exam_history_created_at ON exam_history (created_at);
CREATE INDEX idx_exam_history_score ON exam_history (score_percentage);

-- --------------------------------------------------------

--
-- Table structure for table uploaded_images
--

CREATE TABLE uploaded_images (
  id VARCHAR(50) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  image_data BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uploaded_images_created_at ON uploaded_images (created_at);

-- --------------------------------------------------------

--
-- Table structure for table s3_images
--

CREATE TABLE s3_images (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  original_filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_url VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_s3_images_s3_key ON s3_images (s3_key);
CREATE INDEX idx_s3_images_created_at ON s3_images (created_at);

-- --------------------------------------------------------

--
-- Dumping data for table users
--

INSERT INTO users (id, student_id, profile_picture, full_name, username, password, role, phone, is_active, last_login, created_at, updated_at) VALUES
('4fbf1f6b-3783-41a7-acd4-b381198ce872', '001', NULL, 'Super Admin', 'admin@exam.sys', '$2b$10$Ew5HzoCcvXidwmHYrfRX4uJpploeTDHemOrt8KdQ/Rsyvh.4ghmBa', 'Super Admin', '', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('33dfb6e0-0c04-40f9-b947-1f3d18781821', '002', NULL, 'Instructor', 'instructor@exam.sys', '$2b$10$WZCtEyhQP0quiwVbG16fBOtTAxfIWFZ8nSfAi94xjEiv.vmqSPvSu', 'Instructor', '', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('767752e6-650b-4f9c-823d-5d8286ee9b97', '003', NULL, 'Student', 'student@exam.sys', '$2b$10$dORf22/L2eps/sr86RirA.Comp1K7qTvsm8qmdii5fIUWWgvoq10m', 'Student', '', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- --------------------------------------------------------

--
-- Sample data for table subjects
--

INSERT INTO subjects (id, name, description, subject_picture_s3_url, created_at, updated_at, is_active) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Mathematics', 'Basic mathematics and algebra', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Science', 'General science', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'English', 'English language and literature', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true);

-- --------------------------------------------------------

--
-- Sample data for table subtopics
--

INSERT INTO subtopics (id, subject_id, name, question_count, created_at, updated_at, is_active) VALUES
('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Algebra', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Geometry', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Physics', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Chemistry', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Grammar', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
('9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Literature', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true);
