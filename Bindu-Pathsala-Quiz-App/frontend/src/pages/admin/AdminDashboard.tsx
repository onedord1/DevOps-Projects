import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { subjectAPI, attemptAPI } from '@/services/api';
import { Subject, QuizAttempt } from '@/types';
import { BookOpen, FileText, Users, Award, Plus } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsData, attemptsData] = await Promise.all([
        subjectAPI.getAll(),
        attemptAPI.getAll(),
      ]);
      setSubjects(subjectsData);
      setAttempts(attemptsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const totalQuizzes = subjects.reduce((sum, s) => sum + (s.quiz_count || 0), 0);
  const completedAttempts = attempts.filter((a) => a.status === 'graded').length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage subjects, quizzes, and view analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attempts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedAttempts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/admin/subjects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center p-6">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Subjects</h3>
                    <p className="text-sm text-gray-600">Create and edit subjects</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/attempts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center p-6">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Results</h3>
                    <p className="text-sm text-gray-600">Check student attempts</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Subjects Overview */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subjects Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                      {subject.quiz_count || 0} Quizzes
                    </span>
                  </div>
                  <CardTitle className="mt-4">{subject.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {subject.description || 'No description'}
                  </p>
                  <Link to={`/admin/subjects/${subject.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Quizzes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
