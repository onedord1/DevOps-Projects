UPDATE quizzes SET allowed_time = NULL WHERE allowed_time = 0;
UPDATE quizzes SET time_per_question = NULL WHERE time_per_question = 0;