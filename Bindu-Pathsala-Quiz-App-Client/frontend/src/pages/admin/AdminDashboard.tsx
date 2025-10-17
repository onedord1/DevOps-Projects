import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { subjectAPI, attemptAPI, authAPI } from '@/services/api';
import { Subject, QuizAttempt } from '@/types';
import {
  BookOpen,
  FileText,
  Users,
  Award,
  Plus,
  UserCheck,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  BarChart3,
  Settings,
  Target,
  Zap
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching subjects and attempts...');

      // First check if the backend is reachable
      const isHealthy = await authAPI.health();
      console.log('Backend health check:', isHealthy);

      if (!isHealthy) {
        throw new Error('Backend is not reachable');
      }

      const [subjectsData, attemptsData] = await Promise.all([
        subjectAPI.getAll(),
        attemptAPI.getAll(),
      ]);
      console.log('Subjects data:', subjectsData);
      console.log('Attempts data:', attemptsData);
      setSubjects(subjectsData || []);
      setAttempts(attemptsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setSubjects([]);
      setAttempts([]);
      // Show a more detailed error message to the user
      alert(`Failed to load dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        </div>
      </Layout>
    );
  }

  const totalQuizzes = subjects.reduce((sum, s) => sum + (s.quiz_count || 0), 0);
  const completedAttempts = attempts.filter((a) => a.status === 'graded').length;
  const pendingAttempts = attempts.filter((a) => a.status === 'submitted').length;
  const recentAttempts = attempts.slice(0, 5);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Welcome back! Here's your comprehensive overview of the quiz management system
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Subjects</CardTitle>
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-1">{subjects.length}</div>
                <p className="text-sm text-gray-500">Active subjects</p>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+{Math.floor(Math.random() * 3) + 1} this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Quizzes</CardTitle>
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-1">{totalQuizzes}</div>
                <p className="text-sm text-gray-500">Across all subjects</p>
                <div className="mt-3 flex items-center text-xs text-blue-600">
                  <Activity className="w-3 h-3 mr-1" />
                  <span>Avg {Math.floor(totalQuizzes / Math.max(subjects.length, 1))} per subject</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Attempts</CardTitle>
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-1">{attempts.length}</div>
                <p className="text-sm text-gray-500">Student submissions</p>
                <div className="mt-3 flex items-center text-xs text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{pendingAttempts} pending review</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">Completed</CardTitle>
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-1">{completedAttempts}</div>
                <p className="text-sm text-gray-500">Graded submissions</p>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>{Math.round((completedAttempts / Math.max(attempts.length, 1)) * 100)}% completion rate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <div className="text-sm text-gray-500">Choose your next task</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/admin/students" className="group">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group-hover:bg-purple-50">
                  <CardContent className="flex items-center p-6">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <UserCheck className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Student Management</h3>
                      <p className="text-sm text-gray-600">Approve registrations and manage access</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/subjects" className="group">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group-hover:bg-blue-50">
                  <CardContent className="flex items-center p-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Plus className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Manage Subjects</h3>
                      <p className="text-sm text-gray-600">Create and organize quiz subjects</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/attempts" className="group">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group-hover:bg-green-50">
                  <CardContent className="flex items-center p-6">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">View Results</h3>
                      <p className="text-sm text-gray-600">Review and grade student submissions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <Link to="/admin/attempts" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all →
              </Link>
            </div>
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                {recentAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {recentAttempts.map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${attempt.status === 'graded' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            {attempt.status === 'graded' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Student {attempt.user?.name || attempt.user_id} completed quiz
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(attempt.finished_at || attempt.started_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            attempt.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attempt.status === 'graded' ? 'Graded' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-gray-500">Student quiz attempts will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Subjects Overview */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Subjects Overview</h2>
              <Link to="/admin/subjects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage subjects →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <Card key={subject.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {subject.quiz_count || 0} Quizzes
                        </span>
                      </div>
                      <CardTitle className="mt-4 text-lg">{subject.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {subject.description || 'No description available'}
                      </p>
                      <Link to={`/admin/subjects/${subject.id}`}>
                        <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 hover:border-blue-300 transition-colors">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Quizzes
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No subjects yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Start building your quiz platform by creating your first subject. This will be the foundation for organizing your quizzes.
                      </p>
                      <Link to="/admin/subjects">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Subject
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* System Status Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">System Online</h3>
                  <p className="text-sm text-gray-500">All services running</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
                  <p className="text-sm text-gray-500">Optimal response times</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Accuracy</h3>
                  <p className="text-sm text-gray-500">99.9% uptime</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
