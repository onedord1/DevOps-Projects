import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ExpensesList } from './pages/ExpensesList';
import { AddExpense } from './pages/AddExpense';
import { Categories } from './pages/Categories';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/expenses"
          element={
            <Layout>
              <ExpensesList />
            </Layout>
          }
        />
        <Route
          path="/expenses/new"
          element={
            <Layout>
              <AddExpense />
            </Layout>
          }
        />
        <Route
          path="/categories"
          element={
            <Layout>
              <Categories />
            </Layout>
          }
        />
        <Route
          path="/budgets"
          element={
            <Layout>
              <Budgets />
            </Layout>
          }
        />
        <Route
          path="/reports"
          element={
            <Layout>
              <Reports />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
        
        {/* Redirect to appropriate page */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;