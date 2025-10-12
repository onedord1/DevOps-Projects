import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(studentId, password);
      // Redirect based on user role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-2xl animate-pulse-glow">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            বিন্দু পাঠশালা
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <p className="text-lg">তোমার শিক্ষা, আমাদের মিশন</p>
          </div>
          <p className="text-gray-500">Sign in to continue your educational journey</p>
        </div>

        <Card className="card-edu animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-blue-800 flex items-center justify-center space-x-2">
              <span>Welcome Back</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access your learning dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="studentId" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <span>Student ID</span>
                </label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <span>Password</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-edu-primary text-lg font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In to Learn'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                New to our platform?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors">
                  Create your account
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>

        <div className="text-center mt-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
            <span>Made by</span>
            <span className="font-semibold text-blue-600">Beatz</span>
            <span>with</span>
            <span className="font-semibold text-red-500">Love</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </p>
        </div>
      </div>
    </div>
  );
};
