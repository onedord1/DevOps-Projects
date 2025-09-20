export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  currency: string;
  locale: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    budgetAlerts: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  category?: Category;
  tags: Tag[];
  receipt?: string;
  recurring?: RecurringConfig;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  categoryId?: string;
  category?: Category;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number; // percentage
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  monthlyTotal: number;
  weeklyTotal: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
  budgetStatus: Array<{
    budgetId: string;
    budgetName: string;
    spent: number;
    total: number;
    percentage: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}