import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, BookOpen, User, ChevronDown, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to={user ? (isAdmin ? '/admin' : '/dashboard') : '/'} className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">বিন্দু পাঠশালা</span>
          </Link>

          <nav className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                {!isAdmin && (
                  <Link
                    to="/my-attempts"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    My Attempts
                  </Link>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center space-x-2 text-gray-700 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user.name}</span>
                    {isAdmin && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {!isAdmin && (
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Update Profile
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin/profile/overview"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Profile Overview
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
