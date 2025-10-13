import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { attemptAPI } from '@/services/api';
import { QuizAttemptWithDetails } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Home, Loader2, Award, Clock, FileText } from 'lucide-react';

export const QuizResult: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [result, setResult] = useState<QuizAttemptWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const data = await attemptAPI.getResult(attemptId!);
      setResult(data);
    } catch (err: any) {
      setError('Failed to load quiz result');
    } finally {
      setLoading(false);
    }
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

  if (error || !result) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Result not found'}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const correctCount = result.answers?.filter((a) => a.is_correct).length || 0;
  const totalQuestions = result.answers?.length || 0;
  const percentage = result.score;

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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Score Summary Card */}
        <Card className="mb-8 overflow-hidden">
          <div className={`${getScoreBgColor(percentage)} p-8`}>
            <div className="text-center">
              <Award className={`h-20 w-20 mx-auto mb-4 ${getScoreColor(percentage)}`} />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Quiz Completed!
              </h1>
              <p className="text-lg text-gray-700 mb-4">
                You scored <span className={`font-bold ${getScoreColor(percentage)}`}>{percentage.toFixed(1)}%</span>
              </p>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{correctCount}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{totalQuestions - correctCount}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Quiz</div>
                  <div className="font-medium">{result.quiz_title}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Completed At</div>
                  <div className="font-medium">
                    {result.finished_at ? formatDateTime(result.finished_at) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-medium capitalize">{result.status}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Answer Review</h2>
        </div>

        <div className="space-y-4">
          {result.answers?.map((answer, index) => (
            <Card key={answer.id || `question-${index}`} className={answer.was_answered ? (answer.is_correct ? 'border-green-200' : 'border-red-200') : 'border-gray-200'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-start">
                    <span className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1 ${
                      answer.was_answered ? (answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') : 'bg-gray-100 text-gray-800'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="flex-1">{answer.question_text}</span>
                  </CardTitle>
                  {answer.was_answered ? (
                    answer.is_correct ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    )
                  ) : (
                    <span className="text-gray-400 flex-shrink-0">Not answered</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {answer.was_answered && answer.selected_option_text && (
                    <div className={`p-3 rounded-lg ${
                      answer.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="text-sm font-medium text-gray-700 mb-1">Your Answer:</div>
                      <div className={answer.is_correct ? 'text-green-900' : 'text-red-900'}>
                        {answer.selected_option_text}
                      </div>
                    </div>
                  )}
                  {!answer.was_answered && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">Status:</div>
                      <div className="text-gray-900">Question was not answered</div>
                    </div>
                  )}
                  {answer.was_answered && !answer.is_correct && answer.correct_option_text && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</div>
                      <div className="text-green-900">{answer.correct_option_text}</div>
                    </div>
                  )}
                  {answer.time_taken && (
                    <div className="text-sm text-gray-600">
                      Time taken: {answer.time_taken} seconds
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(isAdmin ? '/admin/attempts' : '/my-attempts')}>
            View All Attempts
          </Button>
        </div>
      </div>
    </Layout>
  );
};
