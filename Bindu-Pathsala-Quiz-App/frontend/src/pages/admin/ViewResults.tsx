import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { attemptAPI } from '@/services/api';
import { QuizAttempt } from '@/types';
import { ArrowLeft, Eye, Award } from 'lucide-react';

export const ViewResults: React.FC = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await attemptAPI.getAll();
      setAttempts(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Results</h1>
          <p className="text-gray-600">View all quiz attempts and student performance</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">Loading results...</div>
        ) : attempts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attempts Yet</h3>
              <p className="text-gray-600">Student quiz attempts will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <Card key={attempt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {attempt.quiz?.title || 'Quiz'}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Student: {attempt.user?.name || 'Unknown'} ({attempt.user?.student_id})
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(attempt.status)}`}>
                      {attempt.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-lg font-semibold">
                        {attempt.score !== null ? `${attempt.score.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="text-lg font-semibold">
                        {attempt.quiz?.subject?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Started</p>
                      <p className="text-sm">{formatDate(attempt.started_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Finished</p>
                      <p className="text-sm">
                        {attempt.finished_at ? formatDate(attempt.finished_at) : 'In Progress'}
                      </p>
                    </div>
                  </div>
                  {attempt.status === 'graded' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/quiz/result/${attempt.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
