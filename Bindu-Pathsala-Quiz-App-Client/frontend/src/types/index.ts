export type UserRole = 'admin' | 'student';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  batch?: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  quiz_count?: number;
}

export type QuizStatus = 'draft' | 'published' | 'closed';

export interface Quiz {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  total_questions: number;
  time_per_question?: number;
  allowed_time?: number;
  randomize_order: boolean;
  status: QuizStatus;
  batch?: string;
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  image_path?: string;
  time_limit?: number;
  options: Option[];
}

export interface Option {
  id: string;
  question_id?: string;
  text: string;
  is_correct?: boolean;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  finished_at?: string;
  score: number;
  status: AttemptStatus;
  created_at: string;
  updated_at: string;
  quiz?: Quiz;
  user?: User;
}

export interface Answer {
  id: string;
  quiz_attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  time_taken?: number;
  created_at: string;
}

export interface AnswerDetail extends Answer {
  question_text: string;
  selected_option_text: string;
  is_correct: boolean;
  correct_option_text: string;
  time_taken_display?: number;
  was_answered: boolean;
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz_title: string;
  subject_name: string;
  student_name: string;
  student_id: string;
  answers?: AnswerDetail[];
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  batch_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  quiz?: Quiz;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export interface StudentStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}
