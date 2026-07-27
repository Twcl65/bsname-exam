-- SQL Script to Reset Users Table in Supabase PostgreSQL
-- Running this script will truncate the users table (cascading to dependent tables like exam_history)
-- and insert the three default users with their new credentials.

TRUNCATE TABLE users CASCADE;

INSERT INTO users (
  id, 
  student_id, 
  profile_picture, 
  full_name, 
  username, 
  password, 
  role, 
  phone, 
  is_active, 
  last_login, 
  created_at, 
  updated_at
) VALUES
('4fbf1f6b-3783-41a7-acd4-b381198ce872', '001', NULL, 'Super Admin', 'admin@exam.sys', '$2b$10$Ew5HzoCcvXidwmHYrfRX4uJpploeTDHemOrt8KdQ/Rsyvh.4ghmBa', 'Super Admin', '', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('33dfb6e0-0c04-40f9-b947-1f3d18781821', '002', NULL, 'Instructor', 'instructor@exam.sys', '$2b$10$WZCtEyhQP0quiwVbG16fBOtTAxfIWFZ8nSfAi94xjEiv.vmqSPvSu', 'Instructor', '', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('767752e6-650b-4f9c-823d-5d8286ee9b97', '003', NULL, 'Student', 'student@exam.sys', '$2b$10$dORf22/L2eps/sr86RirA.Comp1K7qTvsm8qmdii5fIUWWgvoq10m', 'Student', '', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
