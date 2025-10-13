import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { quizAPI, questionAPI, sessionAPI } from '@/services/api';
import { Quiz, Question, QuizSession } from '@/types';
import { ArrowLeft, Plus, Trash2, Save, Calendar, Clock, Edit } from 'lucide-react';

export const EditQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showEditQuiz, setShowEditQuiz] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    time_limit: 60,
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  });
  const [newSession, setNewSession] = useState({
    batch_name: '',
    start_time: '',
    end_time: '',
  });
  const [editQuizData, setEditQuizData] = useState({
    title: '',
    description: '',
    batch: '',
  });

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const [quizData, questionsData, sessionsData] = await Promise.all([
        quizAPI.getById(quizId!),
        quizAPI.getQuestions(quizId!),
        sessionAPI.getByQuiz(quizId!),
      ]);
      setQuiz(quizData);
      setQuestions(questionsData);
      setSessions(sessionsData);
      // Initialize edit form data
      setEditQuizData({
        title: quizData.title,
        description: quizData.description,
        batch: quizData.batch || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const validOptions = newQuestion.options.filter(opt => opt.text.trim() !== '');
      if (validOptions.length < 2) {
        setError('Please provide at least 2 options');
        setSaving(false);
        return;
      }

      if (!validOptions.some(opt => opt.is_correct)) {
        setError('Please mark at least one correct answer');
        setSaving(false);
        return;
      }

      await questionAPI.create({
        quiz_id: quizId!,
        text: newQuestion.text,
        time_limit: newQuestion.time_limit,
        options: validOptions,
      });

      setSuccess('Question added successfully!');
      setShowAddQuestion(false);
      setNewQuestion({
        text: '',
        time_limit: 60,
        options: [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ],
      });
      fetchQuizData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionAPI.delete(questionId);
      setSuccess('Question deleted successfully!');
      fetchQuizData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handlePublishQuiz = async () => {
    try {
      await quizAPI.update(quizId!, {
        status: 'published',
        batch: quiz?.batch || "",
      });
      setSuccess('Quiz published successfully!');
      fetchQuizData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish quiz');
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await sessionAPI.create({
        quiz_id: quizId!,
        batch_name: newSession.batch_name,
        start_time: new Date(newSession.start_time).toISOString(),
        end_time: new Date(newSession.end_time).toISOString(),
      });

      setSuccess('Session/Batch created successfully!');
      setShowAddSession(false);
      setNewSession({ batch_name: '', start_time: '', end_time: '' });
      fetchQuizData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session/batch?')) return;

    try {
      await sessionAPI.delete(sessionId);
      setSuccess('Session deleted successfully!');
      fetchQuizData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete session');
    }
  };

  const handleEditQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await quizAPI.update(quizId!, {
        title: editQuizData.title,
        description: editQuizData.description,
        batch: editQuizData.batch || "",
      });

      setSuccess('Quiz updated successfully!');
      setShowEditQuiz(false);
      fetchQuizData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading quiz...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/subjects/${quiz?.subject_id}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz?.title}</h1>
            <p className="text-gray-600">{quiz?.description}</p>
            {quiz?.batch && (
              <div className="mt-2">
                <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                  Batch: {quiz.batch}
                </span>
              </div>
            )}
            <div className="mt-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  quiz?.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {quiz?.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditQuiz(!showEditQuiz)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {showEditQuiz ? 'Cancel Edit' : 'Edit Quiz'}
            </Button>
            {quiz?.status === 'draft' && (
              <Button onClick={handlePublishQuiz}>
                <Save className="h-4 w-4 mr-2" />
                Publish Quiz
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Questions</div>
              <div className="text-2xl font-bold">{questions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Time Allowed</div>
              <div className="text-2xl font-bold">{(quiz?.allowed_time || 0) / 60} min</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Time per Question</div>
              <div className="text-2xl font-bold">{quiz?.time_per_question || 0} sec</div>
            </CardContent>
          </Card>
        </div>

        {showEditQuiz && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Quiz Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditQuiz} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quiz Title *</label>
                  <Input
                    value={editQuizData.title}
                    onChange={(e) => setEditQuizData({ ...editQuizData, title: e.target.value })}
                    placeholder="Quiz title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Input
                    value={editQuizData.description}
                    onChange={(e) => setEditQuizData({ ...editQuizData, description: e.target.value })}
                    placeholder="Quiz description"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Batch Restriction</label>
                  <Input
                    value={editQuizData.batch}
                    onChange={(e) => setEditQuizData({ ...editQuizData, batch: e.target.value.toUpperCase() })}
                    placeholder="Enter batch letter (e.g., A, B, C, D, E) or leave empty"
                    maxLength={1}
                  />
                  <p className="text-xs text-gray-500">
                    Enter a single letter (A-E) to restrict quiz to that batch only
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditQuiz(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Questions</CardTitle>
              <Button onClick={() => setShowAddQuestion(!showAddQuestion)}>
                <Plus className="h-4 w-4 mr-2" />
                {showAddQuestion ? 'Cancel' : 'Add Question'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddQuestion && (
              <form onSubmit={handleAddQuestion} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Question Text *</label>
                    <Input
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                      placeholder="Enter your question"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Time Limit (seconds)</label>
                    <Input
                      type="number"
                      value={newQuestion.time_limit}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, time_limit: parseInt(e.target.value) })
                      }
                      min="10"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Options (check the correct answer)
                    </label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index].is_correct = e.target.checked;
                            setNewQuestion({ ...newQuestion, options: newOptions });
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <Input
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index].text = e.target.value;
                            setNewQuestion({ ...newQuestion, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Question'}
                  </Button>
                </div>
              </form>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No questions yet. Add your first question to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">
                        {index + 1}. {question.text}
                      </h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 ml-4">
                      {question.options?.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className={`text-sm ${
                            option.is_correct ? 'text-green-700 font-medium' : 'text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option.text}
                          {option.is_correct && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Sessions/Batches */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quiz Sessions / Batches</CardTitle>
              <Button onClick={() => setShowAddSession(!showAddSession)}>
                <Plus className="h-4 w-4 mr-2" />
                {showAddSession ? 'Cancel' : 'Add Session'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddSession && (
              <form onSubmit={handleAddSession} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Batch Name *</label>
                    <Input
                      value={newSession.batch_name}
                      onChange={(e) => setNewSession({ ...newSession, batch_name: e.target.value })}
                      placeholder="e.g., Batch A, Morning Session, Group 1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Time *</label>
                      <Input
                        type="datetime-local"
                        value={newSession.start_time}
                        onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">End Time *</label>
                      <Input
                        type="datetime-local"
                        value={newSession.end_time}
                        onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Session'}
                  </Button>
                </div>
              </form>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No sessions yet. Create sessions/batches to relaunch this quiz at different times.
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const now = new Date();
                  const startTime = new Date(session.start_time);
                  const endTime = new Date(session.end_time);
                  const isActive = now >= startTime && now <= endTime;
                  const isPast = now > endTime;
                  const isFuture = now < startTime;

                  return (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{session.batch_name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                isActive
                                  ? 'bg-green-100 text-green-800'
                                  : isFuture
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {isActive ? 'Active Now' : isFuture ? 'Upcoming' : 'Ended'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">Start</div>
                            <div>{new Date(session.start_time).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">End</div>
                            <div>{new Date(session.end_time).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
