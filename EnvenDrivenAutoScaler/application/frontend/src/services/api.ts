import { config } from '../config';
import type { 
  User, 
  Expense, 
  Category, 
  Tag, 
  Budget, 
  ExpenseStats, 
  ApiResponse, 
  PaginatedResponse,
  ExpenseFilters 
} from '../types';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = config.API_URL;
    // Get token from localStorage if it exists
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    // Combine firstName and lastName into a single name field
    const fullName = `${data.firstName} ${data.lastName}`;
    
    // Create payload in the format backend expects
    const payload = {
      name: fullName,
      email: data.email,
      password: data.password,
    };
    
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<null>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  // User
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/profile');
  }

  async updateUser(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Tags - NEW
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.request('/tags');
  }

  // Expenses
  async getExpenses(
    page = 1,
    limit = config.DEFAULT_PAGE_SIZE,
    filters?: ExpenseFilters
  ): Promise<PaginatedResponse<Expense>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request(`/expenses?${params}`);
  }

  async getExpense(id: string): Promise<ApiResponse<Expense>> {
    return this.request(`/expenses/${id}`);
  }

  async createExpense(data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Expense>> {
    // Convert field names to match backend expectations
    const payload: any = {
      category_id: data.categoryId,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      description: data.description,
      receipt_url: data.receipt,
    };
    
    // Handle tags properly
    if (data.tags && Array.isArray(data.tags)) {
      // If it's an array, convert to comma-separated string
      payload.tags = data.tags.join(',');
    } else if (data.tags && typeof data.tags === 'string') {
      // If it's already a string, use it as is
      payload.tags = data.tags;
    } else {
      // If it's undefined or null, use empty string
      payload.tags = '';
    }
    
    console.log('API payload:', payload);
    
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<ApiResponse<Expense>> {
    // Convert field names to match backend expectations
    const payload: any = {};
    
    if (data.categoryId !== undefined) payload.category_id = data.categoryId;
    if (data.amount !== undefined) payload.amount = data.amount;
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.date !== undefined) payload.date = data.date;
    if (data.description !== undefined) payload.description = data.description;
    if (data.receipt !== undefined) payload.receipt_url = data.receipt;
    if (data.tags !== undefined) {
      // Convert array to comma-separated string or handle empty/undefined
      if (Array.isArray(data.tags)) {
        payload.tags = data.tags.join(',');
      } else if (typeof data.tags === 'string') {
        payload.tags = data.tags;
      } else {
        payload.tags = '';
      }
    }
    
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteExpense(id: string): Promise<ApiResponse<null>> {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/categories');
  }

  async createCategory(data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Category>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Budgets
  async getBudgets(): Promise<ApiResponse<Budget[]>> {
    return this.request('/budgets');
  }

  async createBudget(data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Budget>> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: string, data: Partial<Budget>): Promise<ApiResponse<Budget>> {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: string): Promise<ApiResponse<null>> {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports & Analytics
  async getReportsSummary(period?: string): Promise<ApiResponse<any>> {
    const params = period ? `?period=${period}` : '';
    return this.request(`/reports/summary${params}`);
  }

  async getReportsTrends(period?: string): Promise<ApiResponse<any>> {
    const params = period ? `?period=${period}` : '';
    return this.request(`/reports/trends${params}`);
  }

  async getCategoryBreakdown(period?: string): Promise<ApiResponse<any>> {
    const params = period ? `?period=${period}` : '';
    return this.request(`/reports/category-breakdown${params}`);
  }

  async getBudgetAnalysis(): Promise<ApiResponse<any>> {
    return this.request('/reports/budget-analysis');
  }

  // File Operations
  async uploadReceipt(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('receipt', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/upload/receipt`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async importCSV(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('csv', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/import/csv`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async exportCSV(): Promise<Blob> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/export/csv`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }
}

export const apiService = new ApiService();