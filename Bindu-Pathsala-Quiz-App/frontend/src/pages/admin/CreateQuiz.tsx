import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { quizAPI, subjectAPI } from '@/services/api';
import { Subject } from '@/types';
import { ArrowLeft } from 'lucide-react';

export const CreateQuiz: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    total_questions: 0,
    time_per_question: 60,
    allowed_time: 3600,
    randomize_order: false,
  });

  useEffect(() => {
    if (subjectId) {
      fetchSubject();
    }
  }, [subjectId]);

  const fetchSubject = async () => {
    try {
      const data = await subjectAPI.getById(subjectId!);
      setSubject(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subject');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const quiz = await quizAPI.create({
        subject_id: subjectId,
        title: formData.title,
        description: formData.description,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        total_questions: formData.total_questions,
        time_per_question: formData.time_per_question,
        allowed_time: formData.allowed_time,
        randomize_order: formData.randomize_order,
        status: 'draft',
      });
      
      navigate(`/admin/quizzes/${quiz.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/subjects/${subjectId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Quiz - {subject?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quiz Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mid-term Exam"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Quiz description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Time per Question (seconds)</label>
                  <Input
                    type="number"
                    value={formData.time_per_question}
                    onChange={(e) => setFormData({ ...formData, time_per_question: parseInt(e.target.value) })}
                    min="10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Total Time Allowed (seconds)</label>
                  <Input
                    type="number"
                    value={formData.allowed_time}
                    onChange={(e) => setFormData({ ...formData, allowed_time: parseInt(e.target.value) })}
                    min="60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Total Questions</label>
                  <Input
                    type="number"
                    value={formData.total_questions}
                    onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="randomize"
                  checked={formData.randomize_order}
                  onChange={(e) => setFormData({ ...formData, randomize_order: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="randomize" className="text-sm font-medium text-gray-700">
                  Randomize Question Order
                </label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Quiz'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/subjects/${subjectId}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
