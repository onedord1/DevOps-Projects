import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { subjectAPI, quizAPI } from '@/services/api';
import { Subject, Quiz } from '@/types';
import { Plus, FileText, ArrowLeft } from 'lucide-react';

export const ManageQuizzes: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectData, quizzesData] = await Promise.all([
        subjectAPI.getById(subjectId!),
        quizAPI.getBySubject(subjectId!),
      ]);
      setSubject(subjectData);
      setQuizzes(quizzesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
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

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {subject?.name || 'Subject'} - Quizzes
            </h1>
            <p className="text-gray-600">{subject?.description}</p>
          </div>
          <Button onClick={() => navigate(`/admin/subjects/${subjectId}/quizzes/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quizzes Yet</h3>
              <p className="text-gray-600 mb-4">Create your first quiz for this subject</p>
              <Button onClick={() => navigate(`/admin/subjects/${subjectId}/quizzes/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{quiz.title}</CardTitle>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        quiz.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>{quiz.total_questions} questions</span>
                    {quiz.allowed_time && <span>{quiz.allowed_time / 60} minutes</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                  >
                    Manage Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
