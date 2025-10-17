import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { attemptAPI } from '@/services/api';
import { QuizAttempt } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { FileText, Loader2, Award, Calendar, TrendingUp } from 'lucide-react';

export const MyAttempts: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const data = await attemptAPI.getMine();
      setAttempts(data);
    } catch (err: any) {
      setError('Failed to load quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  const completedAttempts = attempts.filter((a) => a.status === 'graded' || a.status === 'submitted');
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + a.score, 0) / completedAttempts.length
      : 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Quiz Attempts</h1>
          <p className="text-gray-600">View your quiz history and performance</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {completedAttempts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attempts.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedAttempts.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attempts List */}
        {attempts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">No quiz attempts yet</p>
              <Link to="/dashboard">
                <Button>Start a Quiz</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">
                        {attempt.quiz?.title || 'Quiz'}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {attempt.quiz?.subject?.name || 'Subject'}
                      </p>
                    </div>
                    {attempt.status === 'graded' || attempt.status === 'submitted' ? (
                      <div className="text-right">
                        <div
                          className={`inline-block px-4 py-2 rounded-lg ${getScoreBgColor(
                            attempt.score
                          )}`}
                        >
                          <div className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                            {attempt.score.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        Started: {formatDateTime(attempt.started_at)}
                      </div>
                      {attempt.finished_at && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          Finished: {formatDateTime(attempt.finished_at)}
                        </div>
                      )}
                    </div>
                    {attempt.status === 'graded' || attempt.status === 'submitted' ? (
                      <Link to={`/quiz/result/${attempt.id}`}>
                        <Button size="sm" variant="outline">
                          View Result
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/quiz/${attempt.quiz_id}/start`}>
                        <Button size="sm">Continue Quiz</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
