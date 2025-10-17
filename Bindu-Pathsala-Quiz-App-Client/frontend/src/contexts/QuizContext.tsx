import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Quiz, Question, QuizAttempt } from '@/types';

export interface QuizState {
  quiz: Quiz | null;
  questions: Question[];
  attempt: QuizAttempt | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  expiredQuestions: Set<number>;
  timeRemaining: number | null;
  questionTimeRemaining: number | null;
  questionStartTimes: Record<number, number>; // Maps question index to start timestamp
  loading: boolean;
  error: string | null;
}

export type QuizAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_QUIZ_DATA'; payload: { quiz: Quiz; questions: Question[]; attempt: QuizAttempt } }
  | { type: 'SET_CURRENT_QUESTION'; payload: number }
  | { type: 'SET_ANSWER'; payload: { questionId: string; optionId: string } }
  | { type: 'SET_EXPIRED_QUESTION'; payload: number }
  | { type: 'SET_TIME_REMAINING'; payload: number | null }
  | { type: 'SET_QUESTION_TIME_REMAINING'; payload: number | null }
  | { type: 'SET_QUESTION_START_TIME'; payload: { questionIndex: number; startTime: number } }
  | { type: 'LOAD_TIMING_DATA'; payload: { expiredQuestions: number[]; questionStartTimes: Record<number, number> } }
  | { type: 'RESET_QUIZ_STATE' };

const initialState: QuizState = {
  quiz: null,
  questions: [],
  attempt: null,
  currentQuestionIndex: 0,
  answers: {},
  expiredQuestions: new Set(),
  timeRemaining: null,
  questionTimeRemaining: null,
  questionStartTimes: {},
  loading: false,
  error: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_QUIZ_DATA':
      return {
        ...state,
        quiz: action.payload.quiz,
        questions: action.payload.questions,
        attempt: action.payload.attempt,
        // Don't reset timing state when resuming - preserve existing data
        loading: false,
        error: null,
      };

    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestionIndex: action.payload };

    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.payload.questionId]: action.payload.optionId },
      };

    case 'SET_EXPIRED_QUESTION':
      return {
        ...state,
        expiredQuestions: new Set([...state.expiredQuestions, action.payload]),
      };

    case 'SET_QUESTION_TIME_REMAINING':
      return { ...state, questionTimeRemaining: action.payload };

    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.payload };

    case 'SET_QUESTION_START_TIME':
      return {
        ...state,
        questionStartTimes: {
          ...state.questionStartTimes,
          [action.payload.questionIndex]: action.payload.startTime,
        },
      };

    case 'LOAD_TIMING_DATA':
      return {
        ...state,
        expiredQuestions: new Set(action.payload.expiredQuestions),
        questionStartTimes: action.payload.questionStartTimes,
      };

    case 'RESET_QUIZ_STATE':
      return initialState;

    default:
      return state;
  }
}

interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  resetQuizState: () => void;
  setQuizData: (quiz: Quiz, questions: Question[], attempt: QuizAttempt) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, optionId: string) => void;
  setExpiredQuestion: (questionIndex: number) => void;
  setTimeRemaining: (time: number | null) => void;
  setQuestionTimeRemaining: (time: number | null | ((prev: number | null) => number | null)) => void;
  setQuestionStartTime: (questionIndex: number, startTime: number) => void;
  loadTimingData: (expiredQuestions: number[], questionStartTimes: Record<number, number>) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used within a QuizProvider');
  }
  return context;
};

interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const resetQuizState = useCallback(() => {
    dispatch({ type: 'RESET_QUIZ_STATE' });
  }, []);

  const setQuizData = useCallback((quiz: Quiz, questions: Question[], attempt: QuizAttempt) => {
    dispatch({ type: 'SET_QUIZ_DATA', payload: { quiz, questions, attempt } });
  }, []);

  const setCurrentQuestion = useCallback((index: number) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: index });
  }, []);

  const setAnswer = useCallback((questionId: string, optionId: string) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, optionId } });
  }, []);

  const setExpiredQuestion = useCallback((questionIndex: number) => {
    dispatch({ type: 'SET_EXPIRED_QUESTION', payload: questionIndex });
  }, []);

  const setTimeRemaining = useCallback((time: number | null) => {
    dispatch({ type: 'SET_TIME_REMAINING', payload: time });
  }, []);

  const setQuestionTimeRemaining = useCallback((timeOrUpdater: number | null | ((prev: number | null) => number | null)) => {
    if (typeof timeOrUpdater === 'function') {
      const updater = timeOrUpdater as (prev: number | null) => number | null;
      dispatch({ type: 'SET_QUESTION_TIME_REMAINING', payload: updater(state.questionTimeRemaining) });
    } else {
      dispatch({ type: 'SET_QUESTION_TIME_REMAINING', payload: timeOrUpdater });
    }
  }, [state.questionTimeRemaining]);

  const setQuestionStartTime = useCallback((questionIndex: number, startTime: number) => {
    dispatch({ type: 'SET_QUESTION_START_TIME', payload: { questionIndex, startTime } });
  }, []);

  const loadTimingData = useCallback((expiredQuestions: number[], questionStartTimes: Record<number, number>) => {
    dispatch({ type: 'LOAD_TIMING_DATA', payload: { expiredQuestions, questionStartTimes } });
  }, []);

  return (
    <QuizContext.Provider
      value={{
        state,
        dispatch,
        resetQuizState,
        setQuizData,
        setCurrentQuestion,
        setAnswer,
        setExpiredQuestion,
        setTimeRemaining,
        setQuestionTimeRemaining,
        setQuestionStartTime,
        loadTimingData,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
