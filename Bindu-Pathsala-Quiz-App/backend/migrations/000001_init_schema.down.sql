-- Drop triggers
DROP TRIGGER IF EXISTS update_quiz_attempts_updated_at ON quiz_attempts;
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_answers_question_id;
DROP INDEX IF EXISTS idx_answers_attempt_id;
DROP INDEX IF EXISTS idx_quiz_attempts_status;
DROP INDEX IF EXISTS idx_quiz_attempts_user_id;
DROP INDEX IF EXISTS idx_quiz_attempts_quiz_id;
DROP INDEX IF EXISTS idx_options_question_id;
DROP INDEX IF EXISTS idx_questions_quiz_id;
DROP INDEX IF EXISTS idx_quizzes_end_time;
DROP INDEX IF EXISTS idx_quizzes_start_time;
DROP INDEX IF EXISTS idx_quizzes_status;
DROP INDEX IF EXISTS idx_quizzes_subject_id;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_student_id;

-- Drop tables
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;

-- Drop enum types
DROP TYPE IF EXISTS attempt_status;
DROP TYPE IF EXISTS quiz_status;
DROP TYPE IF EXISTS user_role;

-- Drop UUID extension
DROP EXTENSION IF EXISTS "uuid-ossp";
