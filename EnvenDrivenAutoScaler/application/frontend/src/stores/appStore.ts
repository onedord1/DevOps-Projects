import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../config';

interface AppStore {
  theme: Theme;
  sidebarOpen: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,

      setTheme: (theme: Theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
      },
    }),
    {
      name: 'app-storage',
    }
  )
);

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('app-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.error('Failed to parse stored app state:', error);
    }
  }
}