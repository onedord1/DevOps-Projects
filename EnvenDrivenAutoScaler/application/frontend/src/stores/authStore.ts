import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import type { User, AuthState } from '../types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login(email, password);
          const { user, token } = response.data;
          
          apiService.setToken(token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.register(data);
          const { user, token } = response.data;
          
          apiService.setToken(token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        apiService.setToken(null);
        // Call logout endpoint
        apiService.logout().catch(console.error);
        set({ user: null, token: null, error: null });
      },

      updateUser: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateUser(data);
          set({ user: response.data, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Update failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await apiService.requestPasswordReset(email);
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Password reset request failed', 
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);