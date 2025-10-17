import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { subjectAPI } from '@/services/api';
import { Subject } from '@/types';
import { BookOpen, ChevronRight, Loader2, Trophy, Target, Zap, Star } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await subjectAPI.getAll();
      setSubjects(data);
    } catch (err: any) {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your learning subjects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-yellow-200/40 to-orange-200/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-green-200/40 to-blue-200/40 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          <div className="mb-12 animate-fade-in-up">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-2xl animate-pulse-glow">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                চোখে ভাবে, মনে গড়ো, বাস্তবতায় হাতে নাও — শিক্ষার যাত্রা শুরু হবে এখানে
              </h1>
              <p className="text-xl text-gray-600 mb-2 flex items-center justify-center space-x-2">
                <Target className="h-6 w-6 text-blue-600" />
                <span>Choose a subject to start exploring quizzes</span>
              </p>
              <p className="text-gray-500">Expand your knowledge with interactive assessments</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {subjects.length === 0 ? (
            <Card className="card-edu text-center py-16 animate-fade-in-up">
              <CardContent>
                <BookOpen className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                <p className="text-2xl text-gray-600 mb-4">No subjects available yet</p>
                <p className="text-gray-500 mb-6">Check back later for new learning content!</p>
                <div className="flex justify-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <Star className="h-5 w-5 text-yellow-500 animate-pulse" style={{animationDelay: '0.2s'}} />
                  <Zap className="h-5 w-5 text-yellow-500 animate-pulse" style={{animationDelay: '0.4s'}} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((subject, index) => (
                <Card
                  key={subject.id}
                  className="card-edu hover:scale-105 transition-all duration-300 animate-fade-in-up group"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      {subject.quiz_count !== undefined && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          {subject.quiz_count} {subject.quiz_count === 1 ? 'Quiz' : 'Quizzes'}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl text-blue-800 group-hover:text-purple-700 transition-colors">
                      {subject.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {subject.description || 'Explore this subject through interactive quizzes'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link to={`/subjects/${subject.id}/quizzes`} className="w-full">
                      <Button className="w-full btn-edu-primary group-hover:shadow-xl transition-all duration-300">
                        <span>Explore Quizzes</span>
                        <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Motivational footer */}
          <div className="mt-16 text-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-green-100 rounded-2xl p-8 border border-blue-200">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-3 rounded-full">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">স্বপ্ন দেখো, প্রস্তুত হও — তুমি কি স্বপ্ন পূরণে প্রস্তুত?</h3>
              <p className="text-gray-600 mb-4">
                জ্ঞান-মাধুরী, মনোবল-উৎপ্লব — তোমার পাঠশালা, বিন্দু পাঠশালা
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Interactive Learning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Progress Tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Instant Feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
