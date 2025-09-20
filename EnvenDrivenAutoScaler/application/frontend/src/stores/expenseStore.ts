import { create } from 'zustand';
import { apiService } from '../services/api';
import type { Expense, ExpenseFilters, PaginatedResponse } from '../types';

interface ExpenseStore {
  expenses: Expense[];
  currentExpense: Expense | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ExpenseFilters;
  
  // Actions
  fetchExpenses: (page?: number, limit?: number) => Promise<void>;
  fetchExpense: (id: string) => Promise<void>;
  createExpense: (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setFilters: (filters: ExpenseFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  currentExpense: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},

  fetchExpenses: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    
    try {
      const { filters } = get();
      const response = await apiService.getExpenses(page, limit, filters);
      
      set({
        expenses: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch expenses',
        isLoading: false,
      });
    }
  },

  fetchExpense: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getExpense(id);
      set({
        currentExpense: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch expense',
        isLoading: false,
      });
    }
  },

  createExpense: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.createExpense(data);
      const { expenses } = get();
      
      set({
        expenses: [response.data, ...expenses],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create expense',
        isLoading: false,
      });
      throw error;
    }
  },

  updateExpense: async (id: string, data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.updateExpense(id, data);
      const { expenses } = get();
      
      set({
        expenses: expenses.map(expense => 
          expense.id === id ? response.data : expense
        ),
        currentExpense: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update expense',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteExpense: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deleteExpense(id);
      const { expenses } = get();
      
      set({
        expenses: expenses.filter(expense => expense.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete expense',
        isLoading: false,
      });
      throw error;
    }
  },

  setFilters: (filters: ExpenseFilters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  clearError: () => set({ error: null }),
}));