import React from 'react';
import { Menu, Moon, Sun, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme, toggleSidebar } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:px-6">
      {/* Mobile menu button */}
      <button
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
      >
        <Menu size={24} className="text-gray-500 dark:text-gray-400" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon size={20} />
          ) : (
            <Sun size={20} />
          )}
        </Button>

        {/* User menu */}
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.firstName}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <User size={16} className="text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};