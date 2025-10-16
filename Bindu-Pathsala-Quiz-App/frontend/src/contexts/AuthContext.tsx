import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '@/types';
import { authAPI } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (studentId: string, password: string) => Promise<User>;
  register: (studentId: string, name: string, email: string, password: string, batch?: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (studentId: string, password: string): Promise<User> => {
    const response: AuthResponse = await authAPI.login({ student_id: studentId, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  };

  const register = async (studentId: string, name: string, email: string, password: string, batch?: string): Promise<User> => {
    const response: AuthResponse = await authAPI.register({
      student_id: studentId,
      name,
      email,
      password,
      batch: batch || undefined,
    });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refresh = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Raw response data:', responseData);

        // Handle wrapped response format from backend
        const updatedUser = responseData.data || responseData;
        console.log('Extracted user data:', updatedUser);

        // Validate that we got proper user data
        if (updatedUser && updatedUser.id && updatedUser.role) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('AuthContext updated with:', updatedUser);
        } else {
          console.error('Invalid user data received from API:', {
            updatedUser,
            hasId: !!updatedUser?.id,
            hasRole: !!updatedUser?.role,
            idType: typeof updatedUser?.id,
            roleType: typeof updatedUser?.role
          });
        }
      } else {
        console.error('Failed to refresh user data:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        // If refresh fails, don't clear the user data, just log the error
        // This prevents the user from losing their admin status due to network issues
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Don't clear user data on network errors to prevent admin role loss
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
