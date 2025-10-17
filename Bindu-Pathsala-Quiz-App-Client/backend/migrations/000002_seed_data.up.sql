-- Insert admin user (password: Admin123)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO users (id, student_id, name, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001', 'AD123456', 'System Administrator', 'admin@quiz.com', '$2a$12$qPxL8zK9mR4vL7nM2pQ8rT5uV0wX1yN3oP4kL5jH6mQ7rS8tU9vB0', 'admin');

-- Insert sample students (password: student123)
-- Password hash generated with bcrypt for 'student123'
INSERT INTO users (id, student_id, name, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000002', 'STU001', 'John Doe', 'john.doe@student.com', '$2a$10$rZ8WQWX5K9Z1YqYXqG4qOX9QYVqKYOYV5ZK5wKZ7h9YqO1xN.Wli', 'student'),
('00000000-0000-0000-0000-000000000003', 'STU002', 'Jane Smith', 'jane.smith@student.com', '$2a$10$rZ8WQWX5K9Z1YqYXqG4qOX9QYVqKYOYV5ZK5wKZ7h9YqO1xN.Wli', 'student'),
('00000000-0000-0000-0000-000000000004', 'STU003', 'Bob Johnson', 'bob.johnson@student.com', '$2a$10$rZ8WQWX5K9Z1YqYXqG4qOX9QYVqKYOYV5ZK5wKZ7h9YqO1xN.Wli', 'student'),
('00000000-0000-0000-0000-000000000005', 'STU004', 'Alice Williams', 'alice.williams@student.com', '$2a$10$rZ8WQWX5K9Z1YqYXqG4qOX9QYVqKYOYV5ZK5wKZ7h9YqO1xN.Wli', 'student'),
('00000000-0000-0000-0000-000000000006', 'STU005', 'Charlie Brown', 'charlie.brown@student.com', '$2a$10$rZ8WQWX5K9Z1YqYXqG4qOX9QYVqKYOYV5ZK5wKZ7h9YqO1xN.Wli', 'student');

-- Insert sample subjects
INSERT INTO subjects (id, name, description) VALUES
('10000000-0000-0000-0000-000000000001', 'Mathematics', 'Core mathematics concepts including algebra, calculus, and geometry'),
('10000000-0000-0000-0000-000000000002', 'Computer Science', 'Programming, algorithms, data structures, and computer systems'),
('10000000-0000-0000-0000-000000000003', 'Physics', 'Classical mechanics, electromagnetism, thermodynamics, and quantum physics'),
('10000000-0000-0000-0000-000000000004', 'English Literature', 'Analysis of classic and contemporary literature, poetry, and prose');

-- Insert sample quizzes
INSERT INTO quizzes (id, subject_id, title, description, start_time, end_time, total_questions, time_per_question, allowed_time, randomize_order, status) VALUES
('20000000-0000-0000-0000-000000000001', 
 '10000000-0000-0000-0000-000000000001', 
 'Algebra Basics Quiz', 
 'Test your understanding of basic algebra concepts',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP + INTERVAL '30 days',
 5,
 60,
 300,
 true,
 'published'),

('20000000-0000-0000-0000-000000000002', 
 '10000000-0000-0000-0000-000000000002', 
 'Data Structures Fundamentals', 
 'Assessment of fundamental data structures knowledge',
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP + INTERVAL '7 days',
 5,
 90,
 450,
 true,
 'published'),

('20000000-0000-0000-0000-000000000003', 
 '10000000-0000-0000-0000-000000000003', 
 'Classical Mechanics Mid-term', 
 'Mid-term examination covering Newton''s laws and kinematics',
 CURRENT_TIMESTAMP + INTERVAL '7 days',
 CURRENT_TIMESTAMP + INTERVAL '14 days',
 5,
 120,
 600,
 false,
 'published');

-- Insert questions for Algebra Basics Quiz
INSERT INTO questions (id, quiz_id, text) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'What is the value of x in the equation 2x + 5 = 15?'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Simplify: 3(x + 4) - 2(x - 1)'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'What is the slope of the line y = 2x + 3?'),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Solve for x: x² - 5x + 6 = 0'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'What is the result of (x + 3)(x - 3)?');

-- Insert options for Question 1
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000001', '5', true),
('30000000-0000-0000-0000-000000000001', '10', false),
('30000000-0000-0000-0000-000000000001', '15', false),
('30000000-0000-0000-0000-000000000001', '7.5', false);

-- Insert options for Question 2
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000002', 'x + 14', true),
('30000000-0000-0000-0000-000000000002', '5x + 10', false),
('30000000-0000-0000-0000-000000000002', 'x + 10', false),
('30000000-0000-0000-0000-000000000002', '5x + 14', false);

-- Insert options for Question 3
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000003', '2', true),
('30000000-0000-0000-0000-000000000003', '3', false),
('30000000-0000-0000-0000-000000000003', '-2', false),
('30000000-0000-0000-0000-000000000003', '1/2', false);

-- Insert options for Question 4
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000004', 'x = 2 or x = 3', true),
('30000000-0000-0000-0000-000000000004', 'x = 1 or x = 6', false),
('30000000-0000-0000-0000-000000000004', 'x = -2 or x = -3', false),
('30000000-0000-0000-0000-000000000004', 'x = 5', false);

-- Insert options for Question 5
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000005', 'x² - 9', true),
('30000000-0000-0000-0000-000000000005', 'x² + 9', false),
('30000000-0000-0000-0000-000000000005', 'x² - 6x + 9', false),
('30000000-0000-0000-0000-000000000005', 'x² + 6x - 9', false);

-- Insert questions for Data Structures Quiz
INSERT INTO questions (id, quiz_id, text) VALUES
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'What is the time complexity of searching in a balanced binary search tree?'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'Which data structure uses LIFO (Last In First Out) principle?'),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002', 'What is the best case time complexity of Quick Sort?'),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'In a hash table with chaining, what happens when a collision occurs?'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'What is the space complexity of merge sort?');

-- Insert options for Data Structures questions
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000006', 'O(log n)', true),
('30000000-0000-0000-0000-000000000006', 'O(n)', false),
('30000000-0000-0000-0000-000000000006', 'O(n²)', false),
('30000000-0000-0000-0000-000000000006', 'O(1)', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000007', 'Stack', true),
('30000000-0000-0000-0000-000000000007', 'Queue', false),
('30000000-0000-0000-0000-000000000007', 'Array', false),
('30000000-0000-0000-0000-000000000007', 'Linked List', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000008', 'O(n log n)', true),
('30000000-0000-0000-0000-000000000008', 'O(n²)', false),
('30000000-0000-0000-0000-000000000008', 'O(n)', false),
('30000000-0000-0000-0000-000000000008', 'O(log n)', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000009', 'The new element is added to a linked list at that index', true),
('30000000-0000-0000-0000-000000000009', 'The old element is replaced', false),
('30000000-0000-0000-0000-000000000009', 'An error is thrown', false),
('30000000-0000-0000-0000-000000000009', 'The hash table is resized', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000010', 'O(n)', true),
('30000000-0000-0000-0000-000000000010', 'O(1)', false),
('30000000-0000-0000-0000-000000000010', 'O(log n)', false),
('30000000-0000-0000-0000-000000000010', 'O(n²)', false);

-- Insert questions for Physics Quiz
INSERT INTO questions (id, quiz_id, text) VALUES
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000003', 'According to Newton''s Second Law, F = ma, what does ''a'' represent?'),
('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000003', 'What is the SI unit of force?'),
('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000003', 'Which of Newton''s laws states that every action has an equal and opposite reaction?'),
('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000003', 'What is the acceleration due to gravity on Earth (approximate)?'),
('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000003', 'An object at rest stays at rest unless acted upon by an external force. This is known as:');

-- Insert options for Physics questions
INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000011', 'Acceleration', true),
('30000000-0000-0000-0000-000000000011', 'Area', false),
('30000000-0000-0000-0000-000000000011', 'Amplitude', false),
('30000000-0000-0000-0000-000000000011', 'Angle', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000012', 'Newton', true),
('30000000-0000-0000-0000-000000000012', 'Joule', false),
('30000000-0000-0000-0000-000000000012', 'Watt', false),
('30000000-0000-0000-0000-000000000012', 'Pascal', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000013', 'Third Law', true),
('30000000-0000-0000-0000-000000000013', 'First Law', false),
('30000000-0000-0000-0000-000000000013', 'Second Law', false),
('30000000-0000-0000-0000-000000000013', 'Law of Universal Gravitation', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000014', '9.8 m/s²', true),
('30000000-0000-0000-0000-000000000014', '10 m/s', false),
('30000000-0000-0000-0000-000000000014', '9.8 km/h', false),
('30000000-0000-0000-0000-000000000014', '1 m/s²', false);

INSERT INTO options (question_id, text, is_correct) VALUES
('30000000-0000-0000-0000-000000000015', 'Newton''s First Law (Law of Inertia)', true),
('30000000-0000-0000-0000-000000000015', 'Newton''s Second Law', false),
('30000000-0000-0000-0000-000000000015', 'Newton''s Third Law', false),
('30000000-0000-0000-0000-000000000015', 'Law of Conservation of Energy', false);
