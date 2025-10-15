import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { QuizProvider } from '@/contexts/QuizContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { QuizList } from '@/pages/QuizList';
import { QuizTaking } from '@/pages/QuizTaking';
import { QuizResult } from '@/pages/QuizResult';
import { MyAttempts } from '@/pages/MyAttempts';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ManageSubjects } from '@/pages/admin/ManageSubjects';
import { ManageQuizzes } from '@/pages/admin/ManageQuizzes';
import { ViewResults } from '@/pages/admin/ViewResults';
import { CreateQuiz } from '@/pages/admin/CreateQuiz';
import { EditQuiz } from '@/pages/admin/EditQuiz';

function App() {
  return (
    <AuthProvider>
      <QuizProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Student Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects/:subjectId/quizzes"
              element={
                <ProtectedRoute>
                  <QuizList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:quizId/start"
              element={
                <ProtectedRoute>
                  <QuizTaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/result/:attemptId"
              element={
                <ProtectedRoute>
                  <QuizResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-attempts"
              element={
                <ProtectedRoute>
                  <MyAttempts />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute requireAdmin>
                  <ManageSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects/:subjectId"
              element={
                <ProtectedRoute requireAdmin>
                  <ManageQuizzes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attempts"
              element={
                <ProtectedRoute requireAdmin>
                  <ViewResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects/:subjectId/quizzes/new"
              element={
                <ProtectedRoute requireAdmin>
                  <CreateQuiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quizzes/:quizId"
              element={
                <ProtectedRoute requireAdmin>
                  <EditQuiz />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </QuizProvider>
    </AuthProvider>
  );
}

export default App;
