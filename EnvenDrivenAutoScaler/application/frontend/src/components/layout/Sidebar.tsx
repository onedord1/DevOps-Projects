// Sidebar.tsx - Enhanced version
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
  X,
  User,
  ChevronDown,
  ChevronRight
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
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-800 lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ExpenseTracker
            </h1>
          </div>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-white" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Navigation Sections */}
          <div className="mt-8 px-3">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Finance Tools
            </h3>
            <div className="mt-2 space-y-1">
              <Link
                to="/reports"
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  location.pathname === '/reports'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <BarChart3 className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-green-600 dark:text-gray-400 dark:group-hover:text-green-400" />
                <span className="truncate">Financial Reports</span>
                {location.pathname === '/reports' && (
                  <ChevronRight className="ml-auto h-4 w-4 text-white" />
                )}
              </Link>
              <Link
                to="/analytics"
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  location.pathname === '/analytics'
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <BarChart3 className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-purple-600 dark:text-gray-400 dark:group-hover:text-purple-400" />
                <span className="truncate">Spending Analytics</span>
                {location.pathname === '/analytics' && (
                  <ChevronRight className="ml-auto h-4 w-4 text-white" />
                )}
              </Link>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-2">
            {/* Help & Support */}
            <Link
              to="/help"
              className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="truncate">Help & Support</span>
              <ChevronRight className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="truncate">Logout</span>
              <ChevronRight className="ml-auto h-4 w-4 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};