import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  PlusCircle, 
  Tag, 
  Target, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Add Expense', href: '/expenses/new', icon: PlusCircle },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Budgets', href: '/budgets', icon: Target },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-800 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ExpenseTracker
          </h1>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};