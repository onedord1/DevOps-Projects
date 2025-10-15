import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { quizAPI, attemptAPI } from '@/services/api';
import { QuizAttempt } from '@/types';
import { formatTime } from '@/lib/utils';
import { ChevronRight, Loader2, Target, Clock, ChevronLeft, AlertCircle } from 'lucide-react';
import { useQuizContext } from '@/contexts/QuizContext';

export const QuizTaking: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const {
    state,
    dispatch,
    setQuizData,
    setCurrentQuestion,
    setAnswer,
    setExpiredQuestion,
    setTimeRemaining,
    setQuestionTimeRemaining,
    setQuestionStartTime,
    loadTimingData,
  } = useQuizContext();

  // Use refs to store timer references and question timing data
  const overallTimerRef = useRef<number | null>(null);
  const questionTimerRef = useRef<number | null>(null);

  // Use a ref to store the current question start time to avoid stale closures
  const currentQuestionStartTimeRef = useRef<number | null>(null);

  // Helper function to save question start times and expired questions to localStorage
  const saveQuestionStartTimes = () => {
    if (quizId) { // Use quizId instead of attempt.id for consistency
      const startTimes = state.questionStartTimes;
      const expiredQuestions = Array.from(state.expiredQuestions);
      const currentQuestionIndex = state.currentQuestionIndex;
      const timingData = { startTimes, expiredQuestions, currentQuestionIndex };
      localStorage.setItem(`quiz_timing_${quizId}`, JSON.stringify(timingData));
    }
  };

  // Helper function to load question start times and expired questions from localStorage
  const loadQuestionStartTimes = () => {
    if (quizId) { // Use quizId instead of attempt.id for consistency
      const saved = localStorage.getItem(`quiz_timing_${quizId}`);
      if (saved) {
        try {
          const timingData = JSON.parse(saved);
          const startTimes = timingData.startTimes || {};
          const expiredQuestions = timingData.expiredQuestions || [];
          const currentQuestionIndex = timingData.currentQuestionIndex !== undefined ? timingData.currentQuestionIndex : 0;
          loadTimingData(expiredQuestions, startTimes);

          // Restore current question index
          if (currentQuestionIndex !== state.currentQuestionIndex) {
            setCurrentQuestion(currentQuestionIndex);
          }

          console.log('Loaded question timing data:', timingData);
        } catch (error) {
          console.error('Failed to load question timing data:', error);
        }
      }
    }
  };

  // Cleanup function to clear all timers and localStorage
  const clearAllTimers = () => {
    if (overallTimerRef.current) {
      window.clearInterval(overallTimerRef.current);
      overallTimerRef.current = null;
    }
    if (questionTimerRef.current) {
      window.clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    // Clear saved question timing data
    if (quizId) {
      localStorage.removeItem(`quiz_timing_${quizId}`);
    }
  };

  // Effect to save timing data when current question changes
  useEffect(() => {
    if (state.questions.length > 0 && state.quiz && quizId) {
      saveQuestionStartTimes();
    }
  }, [state.currentQuestionIndex, state.questions.length, state.quiz, quizId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  useEffect(() => {
    if (quizId) {
      console.log('QuizId changed, initializing quiz:', quizId);
      initializeQuiz();
    }
  }, [quizId]);

  // Overall quiz timer
  useEffect(() => {
    console.log('Overall timer effect triggered:', { quiz: state.quiz, attempt: state.attempt, allowedTime: state.quiz?.allowed_time });

    // Clear existing timer
    if (overallTimerRef.current) {
      window.clearInterval(overallTimerRef.current);
      overallTimerRef.current = null;
    }

    // Clear any existing timer if no valid conditions
    if (!state.quiz || !state.attempt || !state.quiz.allowed_time || state.quiz.allowed_time <= 0) {
      setTimeRemaining(null);
      return;
    }

    try {
      const startTime = new Date(state.attempt.started_at).getTime();
      const endTime = startTime + (state.quiz.allowed_time * 1000);
      console.log('Starting overall timer:', { startTime, endTime, currentTime: Date.now() });

      overallTimerRef.current = window.setInterval(() => {
        try {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          console.log('Timer tick - remaining:', remaining);
          setTimeRemaining(remaining);

          if (remaining === 0) {
            console.log('Overall time expired, auto-submitting');
            handleAutoSubmit();
          }
        } catch (error) {
          console.error('Error in overall timer interval:', error);
        }
      }, 1000);

      return () => {
        if (overallTimerRef.current) {
          console.log('Clearing overall timer');
          window.clearInterval(overallTimerRef.current);
          overallTimerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up overall timer:', error);
      setTimeRemaining(null);
    }
  }, [state.quiz?.id, state.attempt?.id, state.quiz?.allowed_time]); // Only depend on specific IDs and time values

  // Per-question timer - simplified approach
  useEffect(() => {
    console.log('🔥 TIMER EFFECT TRIGGERED for question:', state.currentQuestionIndex);
    console.log('Current state:', {
      currentQuestionIndex: state.currentQuestionIndex,
      questionsLength: state.questions.length,
      quizTitle: state.quiz?.title,
      questionStartTimes: state.questionStartTimes,
      expiredQuestions: Array.from(state.expiredQuestions),
      questionTimeRemaining: state.questionTimeRemaining
    });

    // Clear existing question timer
    if (questionTimerRef.current) {
      console.log('Clearing existing timer');
      window.clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    if (!state.questions[state.currentQuestionIndex] || !state.quiz) {
      console.log('❌ No question or quiz data available, skipping timer');
      return;
    }

    const currentQuestionIndex = state.currentQuestionIndex;
    const currentQuestion = state.questions[currentQuestionIndex];
    const questionTimeLimit = currentQuestion.time_limit || state.quiz.time_per_question || 0;

    console.log('Question time limit:', questionTimeLimit);

    if (questionTimeLimit <= 0) {
      console.log('❌ No time limit for question');
      setQuestionTimeRemaining(null);
      return;
    }

    // Don't start timer for already expired questions
    if (state.expiredQuestions.has(currentQuestionIndex)) {
      console.log('⏰ Question already expired, setting time to 0');
      setQuestionTimeRemaining(0);
      return;
    }

    // Get or create start time for this question
    let questionStartTime = state.questionStartTimes[currentQuestionIndex];

    if (!questionStartTime) {
      // This is a fresh question - set the start time to current time
      questionStartTime = Date.now();
      console.log('🆕 Setting fresh start time for question', currentQuestionIndex, 'at', new Date(questionStartTime));
      setQuestionStartTime(currentQuestionIndex, questionStartTime);
      currentQuestionStartTimeRef.current = questionStartTime;
      saveQuestionStartTimes(); // Save timing data when start time is set
    } else {
      console.log('📅 Using existing start time for question', currentQuestionIndex, 'at', new Date(questionStartTime));
      currentQuestionStartTimeRef.current = questionStartTime;
    }

    // Calculate initial remaining time
    const now = Date.now();
    const elapsedTime = Math.floor((now - questionStartTime) / 1000);
    const calculatedRemainingTime = Math.max(0, questionTimeLimit - elapsedTime);

    console.log('⏱️ Timer initial calculation - start:', new Date(questionStartTime), 'now:', new Date(now), 'elapsed:', elapsedTime, 'calculated:', calculatedRemainingTime, 'limit:', questionTimeLimit);

    // For expired questions, always set time to 0 regardless of calculation
    if (state.expiredQuestions.has(currentQuestionIndex)) {
      console.log('💀 Question is expired, setting time to 0');
      setQuestionTimeRemaining(0);
      return;
    }

    if (calculatedRemainingTime <= 0) {
      console.log('💀 Timer already expired on initialization');
      setExpiredQuestion(currentQuestionIndex);
      setQuestionTimeRemaining(0);
      return;
    }

    console.log('🚀 Setting initial question time remaining to:', calculatedRemainingTime);
    setQuestionTimeRemaining(calculatedRemainingTime);

    // Start timer for current question
    console.log('🎯 Starting timer interval for question', currentQuestionIndex);
    questionTimerRef.current = window.setInterval(() => {
      console.log('⏰ Timer interval running for question', currentQuestionIndex);

      // Check if question became expired while timer was running
      if (state.expiredQuestions.has(currentQuestionIndex)) {
        console.log('💀 Question became expired during timer interval');
        setQuestionTimeRemaining(0);
        if (questionTimerRef.current) {
          window.clearInterval(questionTimerRef.current);
          questionTimerRef.current = null;
        }
        return;
      }

      // Use the ref to get the current start time (avoids stale closures)
      const startTime = currentQuestionStartTimeRef.current;
      if (!startTime) {
        console.log('❌ No start time found in ref for question', currentQuestionIndex);
        return;
      }

      const currentNow = Date.now();
      const currentElapsed = Math.floor((currentNow - startTime) / 1000);
      const currentRemaining = Math.max(0, questionTimeLimit - currentElapsed);

      console.log('📊 Timer update - question:', currentQuestionIndex, 'remaining:', currentRemaining, 'elapsed:', currentElapsed);

      if (currentRemaining <= 0) {
        console.log('💥 Timer expired in interval for question', currentQuestionIndex);
        setExpiredQuestion(currentQuestionIndex);
        setQuestionTimeRemaining(0);
        currentQuestionStartTimeRef.current = null;
        saveQuestionStartTimes(); // Save timing data when question expires
        if (questionTimerRef.current) {
          window.clearInterval(questionTimerRef.current);
          questionTimerRef.current = null;
        }
      } else {
        console.log('🔄 Updating question time remaining to:', currentRemaining);
        setQuestionTimeRemaining(currentRemaining);
      }
    }, 1000);

    return () => {
      console.log('🧹 Cleaning up timer for question', currentQuestionIndex);
      if (questionTimerRef.current) {
        window.clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      currentQuestionStartTimeRef.current = null;
    };
  }, [state.currentQuestionIndex, state.questions, state.quiz, state.questionStartTimes, state.expiredQuestions, setQuestionTimeRemaining, setExpiredQuestion, setQuestionStartTime, loadTimingData, saveQuestionStartTimes]);

  const initializeQuiz = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Initializing quiz:', quizId);

      const [quizData, questionsData] = await Promise.all([
        quizAPI.getById(quizId!),
        quizAPI.getQuestions(quizId!),
      ]);

      console.log('Quiz loaded:', quizData.title, 'Questions:', questionsData.length);

      // Start or resume attempt
      const attemptData = await attemptAPI.start(quizId!);

      // Load existing answers if resuming
      if (attemptData.id) {
        await loadExistingAnswers(attemptData);
      }

      setQuizData(quizData, questionsData, attemptData);

      // Load saved timing data after quiz data is set (always try to load for this quiz)
      loadQuestionStartTimes();
    } catch (err: any) {
      console.error('Quiz initialization error:', err);
      if (err.response?.status === 409) {
        dispatch({ type: 'SET_ERROR', payload: 'You have already submitted this quiz. You cannot retake it.' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Failed to load quiz' });
      }
    }
  };

  const loadExistingAnswers = async (attempt: QuizAttempt) => {
    try {
      const result = await attemptAPI.getResult(attempt.id);
      const answersMap: Record<string, string> = {};

      if (result.answers) {
        result.answers.forEach((answerDetail) => {
          if (answerDetail.was_answered && answerDetail.selected_option_id) {
            answersMap[answerDetail.question_id] = answerDetail.selected_option_id;
          }
        });
      }

      // Set answers in context
      Object.entries(answersMap).forEach(([questionId, optionId]) => {
        setAnswer(questionId, optionId);
      });

      // Load and restore question timing data if available
      // For now, we'll mark questions as started when they have answers
      // In a more complete implementation, you'd want to store question start times in the backend
      if (result.answers) {
        result.answers.forEach((answerDetail) => {
          if (answerDetail.was_answered) {
            // Find the question index
            const questionIndex = state.questions.findIndex(q => q.id === answerDetail.question_id);
            if (questionIndex !== -1) {
              // Only estimate start time if we don't already have one saved
              if (!(questionIndex in state.questionStartTimes)) {
                // Estimate start time based on when the answer was submitted
                // This is a simplified approach - ideally you'd store actual start times
                const estimatedStartTime = new Date(attempt.started_at).getTime() +
                  (questionIndex * 60000); // Assume 1 minute per question for estimation

                setQuestionStartTime(questionIndex, estimatedStartTime);
                saveQuestionStartTimes();
                console.log('Estimated and saved start time for answered question', questionIndex, 'at', new Date(estimatedStartTime));
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to load existing answers:', err);
    }
  };

  const handleAnswerSelect = async (optionId: string) => {
    console.log('handleAnswerSelect called for option', optionId);
    console.log('Current question index:', state.currentQuestionIndex);
    console.log('Is question expired?', state.expiredQuestions.has(state.currentQuestionIndex));
    console.log('Expired questions set:', Array.from(state.expiredQuestions));
    console.log('Question time remaining:', state.questionTimeRemaining);

    // Check if question is expired or time is up
    if (!state.attempt ||
        !state.questions[state.currentQuestionIndex] ||
        state.expiredQuestions.has(state.currentQuestionIndex) ||
        (state.questionTimeRemaining !== null && state.questionTimeRemaining <= 0)) {
      console.log('Answer selection blocked - question is expired, time is up, or invalid');
      return;
    }

    console.log('Processing answer selection...');
    const questionId = state.questions[state.currentQuestionIndex].id;

    setAnswer(questionId, optionId);

    try {
      await attemptAPI.submitAnswer(state.attempt.id, {
        question_id: questionId,
        selected_option_id: optionId,
        time_taken: 0, // Simplified for now
      });
      console.log('Answer submitted successfully');
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    // Prevent navigation to expired questions
    if (state.expiredQuestions.has(index)) {
      return;
    }

    // Allow navigation to any non-expired question for review
    setCurrentQuestion(index);
  };

  const handleNext = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setCurrentQuestion(state.currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (state.currentQuestionIndex > 0) {
      setCurrentQuestion(state.currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!state.attempt) return;

    try {
      await attemptAPI.submit(state.attempt.id);
      navigate(`/quiz/result/${state.attempt.id}`);
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit quiz' });
    }
  };

  const handleAutoSubmit = async () => {
    if (!state.attempt) return;
    try {
      await attemptAPI.submit(state.attempt.id);
      navigate(`/quiz/result/${state.attempt.id}`);
    } catch (err: any) {
      console.error('Auto-submit failed:', err);
    }
  };

  if (state.loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  if (!currentQuestion || state.questions.length === 0) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>No questions available for this quiz.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          {/* Header with timer and progress */}
          <Card className="mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-blue-800 mb-1">{state.quiz?.title}</h2>
                  <p className="text-sm text-gray-600">
                    Question {state.currentQuestionIndex + 1} of {state.questions.length}
                  </p>
                </div>
                {state.timeRemaining !== null && (
                  <div className="text-center">
                    <span className={`text-3xl font-bold ${state.timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatTime(state.timeRemaining)}
                    </span>
                    <p className="text-xs text-gray-500">Time Left</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-4 font-bold">
                      {state.currentQuestionIndex + 1}
                    </div>
                    <span className="flex-1">{currentQuestion.text}</span>
                  </div>
                  {(() => {
                    const question = state.questions[state.currentQuestionIndex];
                    const questionTimeLimit = question?.time_limit || state.quiz?.time_per_question || 0;
                    return questionTimeLimit > 0 ? (
                      <div className="ml-6 text-center">
                        <div className={`p-2 rounded-full ${state.questionTimeRemaining !== null && state.questionTimeRemaining < 10 ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <Clock className={`h-5 w-5 ${state.questionTimeRemaining !== null && state.questionTimeRemaining < 10 ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="mt-1">
                          <span className={`font-bold text-lg ${state.questionTimeRemaining !== null && state.questionTimeRemaining < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {state.questionTimeRemaining !== null ? formatTime(state.questionTimeRemaining) : formatTime(questionTimeLimit)}
                          </span>
                          <p className="text-xs text-gray-500">This Question</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
                {/* Question time progress bar - spanning full width below the header */}
                {(() => {
                  const question = state.questions[state.currentQuestionIndex];
                  const questionTimeLimit = question?.time_limit || state.quiz?.time_per_question || 0;
                  if (questionTimeLimit > 0) {
                    const progressPercent = state.questionTimeRemaining !== null ?
                      (state.questionTimeRemaining / questionTimeLimit) * 100 : 100;
                    console.log('🎨 Rendering progress bar:', {
                      questionTimeRemaining: state.questionTimeRemaining,
                      questionTimeLimit,
                      progressPercent: progressPercent.toFixed(2) + '%',
                      isExpired: state.expiredQuestions.has(state.currentQuestionIndex)
                    });
                    return (
                      <div className="w-full bg-gray-200 rounded-full h-4 mt-3">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ${
                            (state.questionTimeRemaining !== null && state.questionTimeRemaining < 10) || state.expiredQuestions.has(state.currentQuestionIndex) ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max(0, progressPercent)}%` }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.expiredQuestions.has(state.currentQuestionIndex) && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>
                    ⏰ Time's up for this question! You cannot answer it anymore. Please move to the next question.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = state.answers[currentQuestion.id] === option.id;
                  const isDisabled = state.expiredQuestions.has(state.currentQuestionIndex) ||
                                   (state.questionTimeRemaining !== null && state.questionTimeRemaining <= 0);

                  return (
                    <button
                      key={`${option.id}-${isDisabled ? 'disabled' : 'enabled'}`}
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={isDisabled}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50'
                          : isSelected
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected && !isDisabled ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && !isDisabled && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={isSelected && !isDisabled ? 'font-semibold text-blue-900' : 'text-gray-700'}>
                          {option.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  onClick={handlePrevious}
                  disabled={state.currentQuestionIndex === 0}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex space-x-4">
                  {state.currentQuestionIndex === state.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Complete Quiz
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Navigation Grid */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Question Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-3 mb-4">
                {state.questions.map((question, index) => {
                  const isAnswered = !!state.answers[question.id];
                  const isCurrent = index === state.currentQuestionIndex;
                  const isExpired = state.expiredQuestions.has(index);

                  return (
                    <button
                      key={question.id}
                      onClick={() => handleQuestionNavigation(index)}
                      disabled={isExpired}
                      className={`w-12 h-12 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-110 ${
                        isExpired
                          ? 'bg-gradient-to-br from-red-100 to-pink-100 text-red-800 border-2 border-red-300 cursor-not-allowed opacity-60'
                          : isCurrent
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                          : isAnswered
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border-2 border-green-300'
                          : 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-600 border-2 border-gray-300 hover:border-blue-300'
                      }`}
                      title={isExpired ? 'Question time expired' : undefined}
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
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-pink-400 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Time Expired</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
