import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, isLoading, error, user } = useAuthStore();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in to your ExpenseTracker account
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="Enter your email"
              required
            />

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};