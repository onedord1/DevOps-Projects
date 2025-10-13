import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { quizAPI, subjectAPI, sessionAPI } from '@/services/api';
import { Quiz, Subject, QuizSession } from '@/types';
import { formatDateTime, isQuizAvailable } from '@/lib/utils';
import { Calendar, Clock, FileText, Loader2, ArrowLeft, Users } from 'lucide-react';

export const QuizList: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  const fetchData = async () => {
    try {
      const [subjectData, quizzesData, sessionsData] = await Promise.all([
        subjectAPI.getById(subjectId!),
        quizAPI.getBySubject(subjectId!),
        sessionAPI.getBySubject(subjectId!).catch(() => []), // Sessions are optional
      ]);
      setSubject(subjectData);
      setQuizzes(quizzesData);
      setSessions(sessionsData);
    } catch (err: any) {
      setError('Failed to load quizzes');
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {subject?.name || 'Subject'} Quizzes
          </h1>
          <p className="text-gray-600">{subject?.description || 'Available quizzes for this subject'}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Show sessions if available, otherwise show regular quizzes */}
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => {
              const quiz = session.quiz!;
              const now = new Date();
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              const isActive = now >= startTime && now <= endTime;

              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">{session.batch_name}</span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          Available Now
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <div className="font-medium">Session Time</div>
                          <div>{formatDateTime(session.start_time)}</div>
                          <div>to {formatDateTime(session.end_time)}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <div className="font-medium">{quiz.total_questions} Questions</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          {quiz.allowed_time ? (
                            <div>
                              <div className="font-medium">Total: {Math.floor(quiz.allowed_time / 60)} minutes</div>
                              {quiz.time_per_question && quiz.time_per_question > 0 && (
                                <div className="text-xs">Per Q: {quiz.time_per_question}s</div>
                              )}
                            </div>
                          ) : quiz.time_per_question && quiz.time_per_question > 0 ? (
                            <div className="font-medium">{quiz.time_per_question}s per question</div>
                          ) : (
                            <div className="font-medium">No time limit</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <Link to={`/quiz/${quiz.id}/start`}>
                        <Button className="w-full md:w-auto">Start Quiz</Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full md:w-auto">
                        Session Not Active
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No quizzes available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const available = isQuizAvailable(quiz);
              const now = new Date();
              const startTime = new Date(quiz.start_time);
              const endTime = new Date(quiz.end_time);
              const notStarted = now < startTime;
              const ended = now > endTime;

              return (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                        {quiz.batch && (
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-600">{quiz.batch}</span>
                          </div>
                        )}
                      </div>
                      {available && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          Available Now
                        </span>
                      )}
                      {notStarted && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                          Not Started
                        </span>
                      )}
                      {ended && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                          Ended
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <div className="font-medium">Start: {formatDateTime(quiz.start_time)}</div>
                          <div>End: {formatDateTime(quiz.end_time)}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <div className="font-medium">{quiz.total_questions} Questions</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          {quiz.allowed_time ? (
                            <div>
                              <div className="font-medium">Total: {Math.floor(quiz.allowed_time / 60)} minutes</div>
                              {quiz.time_per_question && quiz.time_per_question > 0 && (
                                <div className="text-xs">Per Q: {quiz.time_per_question}s</div>
                              )}
                            </div>
                          ) : quiz.time_per_question && quiz.time_per_question > 0 ? (
                            <div className="font-medium">{quiz.time_per_question}s per question</div>
                          ) : (
                            <div className="font-medium">No time limit</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {available ? (
                      <Link to={`/quiz/${quiz.id}/start`}>
                        <Button className="w-full md:w-auto">Start Quiz</Button>
                      </Link>
                    ) : notStarted ? (
                      <Button disabled className="w-full md:w-auto">
                        Quiz Not Yet Started
                      </Button>
                    ) : (
                      <Button disabled className="w-full md:w-auto">
                        Quiz Ended
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};
