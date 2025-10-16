import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  User,
  Subject,
  Quiz,
  Question,
  QuizAttempt,
  QuizAttemptWithDetails,
  Answer,
  QuizSession,
  ApiResponse,
  StudentStats,
} from '@/types';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { student_id: string; name: string; email: string; password: string; batch?: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  login: async (data: { student_id: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  health: async () => {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },
};

// Subject API
export const subjectAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse<any[]>>('/subjects');
    return response.data.data! as Subject[];
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Subject>>(`/subjects/${id}`);
    return response.data.data!;
  },

  create: async (data: { name: string; description: string }) => {
    const response = await api.post<ApiResponse<Subject>>('/admin/subjects', data);
    return response.data.data!;
  },

  update: async (id: string, data: { name: string; description: string }) => {
    const response = await api.put<ApiResponse<Subject>>(`/admin/subjects/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string) => {
    await api.delete(`/admin/subjects/${id}`);
  },
};

// Quiz API
export const quizAPI = {
  getBySubject: async (subjectId: string) => {
    const response = await api.get<ApiResponse<Quiz[]>>(`/subjects/${subjectId}/quizzes`);
    return response.data.data!;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Quiz>>(`/quizzes/${id}`);
    return response.data.data!;
  },

  getQuestions: async (id: string) => {
    const response = await api.get<ApiResponse<Question[]>>(`/quizzes/${id}/questions`);
    return response.data.data!;
  },

  create: async (data: Partial<Quiz>) => {
    const response = await api.post<ApiResponse<Quiz>>('/admin/quizzes', data);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Quiz>) => {
    const response = await api.put<ApiResponse<Quiz>>(`/admin/quizzes/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string) => {
    await api.delete(`/admin/quizzes/${id}`);
  },
};

// Question API
export const questionAPI = {
  create: async (data: {
    quiz_id: string;
    text: string;
    time_limit?: number;
    options: { text: string; is_correct: boolean }[];
  }) => {
    const response = await api.post<ApiResponse<Question>>('/admin/questions', data);
    return response.data.data!;
  },

  update: async (
    id: string,
    data: {
      text: string;
      time_limit?: number;
      options: { text: string; is_correct: boolean }[];
    }
  ) => {
    const response = await api.put<ApiResponse<Question>>(`/admin/questions/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string) => {
    await api.delete(`/admin/questions/${id}`);
  },
};

// Attempt API
export const attemptAPI = {
  start: async (quizId: string) => {
    const response = await api.post<ApiResponse<QuizAttempt>>(`/quizzes/${quizId}/attempts`);
    return response.data.data!;
  },

  submitAnswer: async (attemptId: string, data: { question_id: string; selected_option_id?: string; time_taken?: number }) => {
    const response = await api.post<ApiResponse<Answer>>(`/attempts/${attemptId}/answer`, data);
    return response.data.data!;
  },

  submit: async (attemptId: string) => {
    const response = await api.post<ApiResponse<QuizAttempt>>(`/attempts/${attemptId}/submit`);
    return response.data.data!;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<QuizAttempt>>(`/attempts/${id}`);
    return response.data.data!;
  },

  getResult: async (id: string) => {
    const response = await api.get<ApiResponse<QuizAttemptWithDetails>>(`/attempts/${id}/result`);
    return response.data.data!;
  },

  getMine: async () => {
    const response = await api.get<ApiResponse<QuizAttempt[]>>('/my-attempts');
    return response.data.data!;
  },

  getAll: async (quizId?: string) => {
    const params = quizId ? { quiz_id: quizId } : {};
    const response = await api.get<ApiResponse<QuizAttempt[]>>('/admin/attempts', { params });
    return response.data.data!;
  },
};

// Session API
export const sessionAPI = {
  create: async (data: {
    quiz_id: string;
    batch_name: string;
    start_time: string;
    end_time: string;
  }) => {
    const response = await api.post<ApiResponse<QuizSession>>(
      `/admin/quizzes/${data.quiz_id}/sessions`,
      data
    );
    return response.data.data!;
  },

  getByQuiz: async (quizId: string) => {
    const response = await api.get<ApiResponse<QuizSession[]>>(`/admin/quizzes/${quizId}/sessions`);
    return response.data.data!;
  },

  getBySubject: async (subjectId: string) => {
    const response = await api.get<ApiResponse<QuizSession[]>>(`/subjects/${subjectId}/sessions`);
    return response.data.data!;
  },

  getAvailable: async () => {
    const response = await api.get<ApiResponse<QuizSession[]>>('/sessions/available');
    return response.data.data!;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<QuizSession>>(`/sessions/${id}`);
    return response.data.data!;
  },

  update: async (
    id: string,
    data: {
      batch_name: string;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }
  ) => {
    const response = await api.put<ApiResponse<QuizSession>>(`/admin/sessions/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string) => {
    await api.delete(`/admin/sessions/${id}`);
  },
};

// Student Management API (Admin only)
export const studentAPI = {
  getAll: async (params?: { status?: string; batch?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.batch) searchParams.append('batch', params.batch);

    const query = searchParams.toString();
    const response = await api.get<ApiResponse<User[]>>(`/admin/students${query ? `?${query}` : ''}`);
    return response.data.data!;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<StudentStats>>('/admin/students/stats');
    return response.data.data!;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<User>>(`/admin/students/${id}`);
    return response.data.data!;
  },

  approve: async (id: string) => {
    const response = await api.put<ApiResponse<User>>(`/admin/students/${id}/approve`);
    return response.data.data!;
  },

  reject: async (id: string) => {
    const response = await api.put<ApiResponse<User>>(`/admin/students/${id}/reject`);
    return response.data.data!;
  },

  revokeRejection: async (id: string) => {
    const response = await api.put<ApiResponse<User>>(`/admin/students/${id}/revoke-rejection`);
    return response.data.data!;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/admin/students/${id}`);
    return response.data;
  },

  updatePassword: async (id: string, newPassword: string) => {
    const response = await api.put<ApiResponse<void>>(`/admin/students/${id}/password`, {
      new_password: newPassword,
    });
    return response.data;
  },
};

export default api;
