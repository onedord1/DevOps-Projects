import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { BookOpen, GraduationCap, Sparkles, Eye, EyeOff } from 'lucide-react';
import { AnimatedCharacters } from '@/components/AnimatedCharacters';

// Validation functions
const validateStudentId = (studentId: string): { isValid: boolean; error?: string } => {
  // Check if it starts with BP followed by numbers
  const studentIdRegex = /^BP\d+$/;
  if (!studentIdRegex.test(studentId)) {
    return {
      isValid: false,
      error: 'Student ID must start with "BP" followed by numbers only (e.g., BP123456)'
    };
  }
  return { isValid: true };
};

const validateAdminId = (adminId: string): { isValid: boolean; error?: string } => {
  // Check if it starts with AD followed by numbers
  const adminIdRegex = /^AD\d+$/;
  if (!adminIdRegex.test(adminId)) {
    return {
      isValid: false,
      error: 'Admin ID must start with "AD" followed by numbers only (e.g., AD123456)'
    };
  }
  return { isValid: true };
};

const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  // Check if password is at least 8 characters, contains letters and numbers, first letter is capital
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long'
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain both letters and numbers'
    };
  }

  if (!/^[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must start with a capital letter'
    };
  }

  return { isValid: true };
};

export const Login: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for messages from navigation state
  React.useEffect(() => {
    if (location.state?.message) {
      if (location.state.type === 'info') {
        setSuccess(location.state.message);
      } else {
        setError(location.state.message);
      }
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate inputs
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error!);
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    // Determine user type and validate ID
    let idValidation;

    if (studentId.startsWith('BP')) {
      idValidation = validateStudentId(studentId);
    } else if (studentId.startsWith('AD')) {
      idValidation = validateAdminId(studentId);
    } else {
      setError('Invalid ID format. Student IDs must start with "BP" and Admin IDs must start with "AD"');
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    if (!idValidation.isValid) {
      setError(idValidation.error!);
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    try {
      const userData = await login(studentId, password);

      // Check user status for students
      if (userData.role === 'student' && userData.status === 'pending') {
        setError('Account is not activated yet. Please contact your administrator for access.');
        setLoading(false);
        return;
      }

      if (userData.role === 'student' && userData.status === 'rejected') {
        setError('Your account has been rejected. Please contact your administrator for assistance.');
        setLoading(false);
        return;
      }

      // Redirect based on user role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setLoading(false);

      // Determine specific error message based on response
      let errorMessage = 'Login failed. Please check your credentials.';

      if (err.response?.status === 401) {
        const serverMessage = err.response.data?.message?.toLowerCase() || '';

        if (serverMessage.includes('student') && serverMessage.includes('id')) {
          errorMessage = 'Student ID not found. Please check your Student ID or contact your administrator.';
        } else if (serverMessage.includes('password')) {
          errorMessage = 'Incorrect password. Please check and try again.';
        } else {
          errorMessage = 'Invalid credentials. Please check your Student ID and password.';
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'Student ID not found. Please check your Student ID or contact your administrator.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      }

      setError(errorMessage);

      // Trigger shake animation for error feedback
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
      {/* Sophisticated background elements */}
      <div className="absolute inset-0">
        {/* Subtle geometric patterns */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-xl"></div>
      </div>

      {/* Professional animated elements - positioned as subtle accents */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatedCharacters
          passwordFocused={passwordFocused}
          isPasswordVisible={showPassword}
          isTyping={isTyping}
        />
      </div>

      {/* Centered login form */}
      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
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
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              বিন্দু পাঠশালা
            </h1>
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <p className="text-lg">তোমার শিক্ষা, আমাদের মিশন</p>
            </div>
            <p className="text-gray-500">Sign in to continue your educational journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 animate-error-slide">
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 animate-fade-in">
                <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="studentId" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <span>User ID</span>
              </label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your user ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                required
                className={`h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all duration-200 ${shake ? 'animate-input-error' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <span>Password</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setIsTyping(e.target.value.length > 0);
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    setIsTyping(false);
                  }}
                  required
                  className={`h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all duration-200 pr-12 ${shake ? 'animate-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-edu-primary text-lg font-semibold transition-all duration-200"
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

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              New to our platform?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors">
                Create your account
              </Link>
            </p>
          </div>

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
    </div>
  );
};
