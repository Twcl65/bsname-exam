-- AWS RDS MySQL Compatible SQL Dump
-- Generated for BSNAME Exam System
-- Compatible with MySQL 8.0+

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `profile_picture` longblob DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Student','Instructor','Super Admin') NOT NULL DEFAULT 'Student',
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_student_id` (`student_id`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `subject_picture_s3_url` varchar(500) DEFAULT NULL,
  `exam_question_limit` int(11) DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_subjects_name` (`name`),
  KEY `idx_subjects_created_at` (`created_at`),
  KEY `idx_subjects_is_active` (`is_active`),
  KEY `idx_subjects_subject_picture_s3_url` (`subject_picture_s3_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subtopics`
--

CREATE TABLE `subtopics` (
  `id` varchar(36) NOT NULL,
  `subject_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `question_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_subtopics_subject_id` (`subject_id`),
  KEY `idx_subtopics_name` (`name`),
  KEY `idx_subtopics_question_count` (`question_count`),
  KEY `idx_subtopics_is_active` (`is_active`),
  CONSTRAINT `subtopics_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` varchar(36) NOT NULL,
  `subtopic_id` varchar(36) NOT NULL,
  `question_text` text NOT NULL,
  `question_image_s3_url` varchar(500) DEFAULT NULL,
  `option_a_text` text NOT NULL,
  `option_a_image_s3_url` varchar(500) DEFAULT NULL,
  `option_b_text` text NOT NULL,
  `option_b_image_s3_url` varchar(500) DEFAULT NULL,
  `option_c_text` text NOT NULL,
  `option_c_image_s3_url` varchar(500) DEFAULT NULL,
  `option_d_text` text NOT NULL,
  `option_d_image_s3_url` varchar(500) DEFAULT NULL,
  `correct_answer` enum('A','B','C','D') NOT NULL,
  `explanation` text DEFAULT NULL,
  `difficulty_level` enum('Easy','Medium','Hard') DEFAULT 'Medium',
  `points` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_subtopic_id` (`subtopic_id`),
  KEY `idx_difficulty` (`difficulty_level`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_questions_question_image_s3_url` (`question_image_s3_url`),
  KEY `idx_questions_option_a_image_s3_url` (`option_a_image_s3_url`),
  KEY `idx_questions_option_b_image_s3_url` (`option_b_image_s3_url`),
  KEY `idx_questions_option_c_image_s3_url` (`option_c_image_s3_url`),
  KEY `idx_questions_option_d_image_s3_url` (`option_d_image_s3_url`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`subtopic_id`) REFERENCES `subtopics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_history`
--

CREATE TABLE `exam_history` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `subject_id` varchar(36) NOT NULL,
  `exam_id` varchar(36) NOT NULL,
  `difficulty_level` enum('Easy','Medium','Hard') NOT NULL,
  `total_questions` int(11) NOT NULL,
  `correct_answers` int(11) NOT NULL,
  `score_percentage` decimal(5,2) NOT NULL,
  `time_taken` int(11) DEFAULT NULL,
  `user_answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_score` (`score_percentage`),
  CONSTRAINT `exam_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_history_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uploaded_images`
--

CREATE TABLE `uploaded_images` (
  `id` varchar(50) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `content_type` varchar(100) NOT NULL,
  `image_data` longblob NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_uploaded_images_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `student_id`, `profile_picture`, `full_name`, `username`, `password`, `role`, `phone`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
('4fbf1f6b-3783-41a7-acd4-b381198ce872', '001', NULL, 'Super Admin', 'admin@exam.sys', '$2b$10$Ew5HzoCcvXidwmHYrfRX4uJpploeTDHemOrt8KdQ/Rsyvh.4ghmBa', 'Super Admin', '', 1, NULL, NOW(), NOW()),
('33dfb6e0-0c04-40f9-b947-1f3d18781821', '002', '', 'Instructor', 'instructor@exam.sys', '$2b$10$WZCtEyhQP0quiwVbG16fBOtTAxfIWFZ8nSfAi94xjEiv.vmqSPvSu', 'Instructor', '', 1, NULL, NOW(), NOW()),
('767752e6-650b-4f9c-823d-5d8286ee9b97', '003', '', 'Student', 'student@exam.sys', '$2b$10$dORf22/L2eps/sr86RirA.Comp1K7qTvsm8qmdii5fIUWWgvoq10m', 'Student', '', 1, NULL, NOW(), NOW());

-- --------------------------------------------------------

--
-- Table structure for table `s3_images`
--

CREATE TABLE `s3_images` (
  `id` varchar(36) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `content_type` varchar(100) NOT NULL,
  `s3_key` varchar(500) NOT NULL,
  `s3_url` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_s3_images_s3_key` (`s3_key`),
  KEY `idx_s3_images_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Sample data for table `subjects`
--

INSERT INTO `subjects` (`id`, `name`, `description`, `subject_picture_s3_url`, `created_at`, `updated_at`, `is_active`) VALUES
(UUID(), 'Mathematics', 'Basic mathematics and algebra', NULL, NOW(), NOW(), 1),
(UUID(), 'Science', 'General science', NULL, NOW(), NOW(), 1),
(UUID(), 'English', 'English language and literature', NULL, NOW(), NOW(), 1);

-- --------------------------------------------------------

--
-- Sample data for table `subtopics`
--

INSERT INTO `subtopics` (`id`, `subject_id`, `name`, `question_count`, `created_at`, `updated_at`, `is_active`) VALUES
(UUID(), (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 'Algebra', 0, NOW(), NOW(), 1),
(UUID(), (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 'Geometry', 0, NOW(), NOW(), 1),
(UUID(), (SELECT id FROM subjects WHERE name = 'Science' LIMIT 1), 'Physics', 0, NOW(), NOW(), 1),
(UUID(), (SELECT id FROM subjects WHERE name = 'Science' LIMIT 1), 'Chemistry', 0, NOW(), NOW(), 1),
(UUID(), (SELECT id FROM subjects WHERE name = 'English' LIMIT 1), 'Grammar', 0, NOW(), NOW(), 1),
(UUID(), (SELECT id FROM subjects WHERE name = 'English' LIMIT 1), 'Literature', 0, NOW(), NOW(), 1);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
