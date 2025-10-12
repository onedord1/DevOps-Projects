import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { quizAPI, attemptAPI } from '@/services/api';
import { Quiz, Question, QuizAttempt } from '@/types';
import { formatTime } from '@/lib/utils';
import { BookOpen, ChevronRight, Loader2, Trophy, Target, Zap, Star, Clock, ChevronLeft, AlertCircle } from 'lucide-react';

export const QuizTaking: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionDisabled, setQuestionDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quizId) {
      initializeQuiz();
    }
  }, [quizId]);

  // Overall quiz timer
  useEffect(() => {
    if (quiz && attempt) {
      console.log('Quiz timer data:', {
        allowed_time: quiz.allowed_time,
        time_per_question: quiz.time_per_question,
        attempt_started_at: attempt.started_at
      });

      if (quiz.allowed_time && quiz.allowed_time > 0) {
        const startTime = new Date(attempt.started_at).getTime();
        const endTime = startTime + quiz.allowed_time * 1000;

        const timer = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(remaining);

          if (remaining === 0) {
            handleAutoSubmit();
          }
        }, 1000);

        return () => clearInterval(timer);
      } else {
        setTimeRemaining(null);
      }
    }
  }, [quiz, attempt]);

  // Per-question timer
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Reset question state
    setQuestionDisabled(false);
    setQuestionStartTime(Date.now());

    const questionTimeLimit = currentQuestion.time_limit || quiz?.time_per_question || 0;
    console.log('Question timer data:', {
      question_time_limit: currentQuestion.time_limit,
      quiz_time_per_question: quiz?.time_per_question,
      calculated_time_limit: questionTimeLimit
    });

    if (questionTimeLimit === 0 || questionTimeLimit === null || questionTimeLimit === undefined) {
      setQuestionTimeRemaining(null);
      return;
    }

    setQuestionTimeRemaining(questionTimeLimit);

    const timer = setInterval(() => {
      setQuestionTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          setQuestionDisabled(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, questions, quiz]);

  const initializeQuiz = async () => {
    try {
      const [quizData, questionsData] = await Promise.all([
        quizAPI.getById(quizId!),
        quizAPI.getQuestions(quizId!),
      ]);

      setQuiz(quizData);
      setQuestions(questionsData);

      // Start attempt
      const attemptData = await attemptAPI.start(quizId!);
      setAttempt(attemptData);
      setQuestionStartTime(Date.now());
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('You have already submitted this quiz. You cannot retake it.');
      } else {
        setError(err.response?.data?.message || 'Failed to load quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (optionId: string) => {
    if (!attempt || !questions[currentQuestionIndex] || questionDisabled) return;
    
    const questionId = questions[currentQuestionIndex].id;
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    
    try {
      await attemptAPI.submitAnswer(attempt.id, {
        question_id: questionId,
        selected_option_id: optionId,
        time_taken: timeTaken,
      });
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }
    
    setSubmitting(true);
    try {
      await attemptAPI.submit(attempt.id);
      navigate(`/quiz/result/${attempt.id}`);
    } catch (err: any) {
      setError('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      await attemptAPI.submit(attempt.id);
      navigate(`/quiz/result/${attempt.id}`);
    } catch (err: any) {
      console.error('Auto-submit failed:', err);
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

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          {/* Header with timer and progress */}
          <Card className="card-edu mb-8 animate-fade-in-up">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-blue-800 mb-1">{quiz?.title}</h2>
                  <p className="text-sm text-gray-600 flex items-center space-x-2">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>•</span>
                    <span>Test your knowledge!</span>
                  </p>
                </div>
                {timeRemaining !== null && (
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${timeRemaining < 60 ? 'bg-red-100 animate-pulse' : 'bg-blue-100'}`}>
                      <Clock className={`h-6 w-6 ${timeRemaining < 60 ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="text-center">
                      <span className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatTime(timeRemaining)}
                      </span>
                      <p className="text-xs text-gray-500">Time Left</p>
                    </div>
                  </div>
                )}
                {timeRemaining === null && quiz?.allowed_time && quiz.allowed_time > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      No time limit
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="quiz-progress h-3">
                  <div
                    className="quiz-progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          {currentQuestion && (
            <Card className="question-card mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0 mt-1 font-bold">
                        {currentQuestionIndex + 1}
                      </div>
                      <span className="flex-1 leading-relaxed">{currentQuestion.text}</span>
                    </div>
                    {questionTimeRemaining !== null && (
                      <div className="ml-6">
                        <div className={`p-2 rounded-full ${questionTimeRemaining < 10 ? 'bg-red-100 animate-pulse' : 'bg-blue-100'}`}>
                          <Clock className={`h-5 w-5 ${questionTimeRemaining < 10 ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="text-center mt-1">
                          <span className={`font-bold text-lg ${questionTimeRemaining < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatTime(questionTimeRemaining)}
                          </span>
                          <p className="text-xs text-gray-500">This Question</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardTitle>
                {questionTimeRemaining !== null && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Question Timer</span>
                      <span>{Math.round((questionTimeRemaining / (currentQuestion.time_limit || quiz?.time_per_question || 60)) * 100)}% Remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          questionTimeRemaining < 10 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${questionTimeRemaining !== null && questionTimeRemaining > 0 ? ((questionTimeRemaining / (currentQuestion.time_limit || quiz?.time_per_question || 60)) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {questionDisabled && (
                  <Alert variant="warning" className="mb-6 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      ⏰ Time's up for this question! Please move to the next question.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={questionDisabled}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                          questionDisabled
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                            : isSelected
                            ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-[1.02]'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-6 h-6 rounded-full border-2 mr-4 flex-shrink-0 transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <span className={`text-base ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                            {option.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="px-6 py-3"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous
                  </Button>

                  <div className="flex space-x-4">
                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn-edu-secondary px-8 py-3 text-lg font-semibold"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          <>
                            <span>Complete Quiz</span>
                            <Trophy className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button onClick={handleNext} className="btn-edu-primary px-6 py-3">
                        Next
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Navigation Grid */}
          <Card className="card-edu animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Question Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-3 mb-4">
                {questions.map((question, index) => {
                  const isAnswered = !!answers[question.id];
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-12 h-12 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-110 ${
                        isCurrent
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg animate-pulse-glow'
                          : isAnswered
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border-2 border-green-300'
                          : 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-600 border-2 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-gray-300 to-slate-300 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Not Answered</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {timeRemaining !== null && timeRemaining < 60 && (
            <Alert variant="warning" className="mt-6 border-orange-200 bg-orange-50 animate-fade-in-up">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>⚠️ Final Minute!</strong> Less than 1 minute remaining! The quiz will be automatically submitted when time runs out.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </Layout>
  );
};
