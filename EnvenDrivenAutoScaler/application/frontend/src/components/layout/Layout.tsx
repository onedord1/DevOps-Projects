import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../utils/cn';
import { useAppStore } from '../../stores/appStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, token } = useAuthStore();
  const { sidebarOpen } = useAppStore();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 ease-in-out lg:ml-64'
        )}
      >
        <Header />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};