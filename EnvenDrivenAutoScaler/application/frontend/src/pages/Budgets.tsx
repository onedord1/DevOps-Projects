// Budgets.tsx - Enhanced version
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Target, AlertTriangle, Calendar, DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';
import { apiService } from '../services/api';

interface Budget {
  id: number;
  user_id: number;
  category_id?: number;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    type: 'expense' | 'income';
    color: string;
    icon: string;
  };
  spent?: number;
  name?: string;
  alertThreshold?: number;
}

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; budget: Budget | null }>({
    isOpen: false,
    budget: null,
  });

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    category_id: '' as string | number,
    start_date: '',
    end_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch budgets on component mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getBudgets();
      
      // Transform backend data to frontend format
      const transformedBudgets = response.data.map((budget: any) => {
        // Generate a name from category if not available
        const name = budget.name || 
          (budget.category ? `${budget.category.name} Budget` : 'Overall Budget');
        
        return {
          ...budget,
          name,
          spent: 0, // Default to 0 until we calculate actual spending
          alertThreshold: 80, // Default threshold
        };
      });
      
      setBudgets(transformedBudgets);
    } catch (err) {
      setError('Failed to fetch budgets. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      currency: 'USD',
      period: 'monthly',
      category_id: '',
      start_date: '',
      end_date: '',
    });
    setErrors({});
    setEditingBudget(null);
  };

  const openModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        amount: budget.amount.toString(),
        currency: budget.currency,
        period: budget.period,
        category_id: budget.category_id?.toString() || '',
        start_date: budget.start_date.split('T')[0],
        end_date: budget.end_date.split('T')[0],
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const budgetData = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        period: formData.period,
        category_id: formData.category_id ? parseInt(formData.category_id as string) : undefined,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      if (editingBudget) {
        await apiService.updateBudget(editingBudget.id.toString(), budgetData);
      } else {
        await apiService.createBudget(budgetData);
      }

      await fetchBudgets();
      closeModal();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError('Failed to save budget. Please try again.');
    }
  };

  const handleDelete = async (budget: Budget) => {
    setDeleteModal({ isOpen: true, budget });
  };

  const confirmDelete = async () => {
    if (deleteModal.budget) {
      try {
        await apiService.deleteBudget(deleteModal.budget.id.toString());
        await fetchBudgets();
      } catch (err) {
        console.error('Error deleting budget:', err);
        setError('Failed to delete budget. Please try again.');
      } finally {
        setDeleteModal({ isOpen: false, budget: null });
      }
    }
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = ((budget.spent || 0) / budget.amount) * 100;
    const isOverBudget = percentage > 100;
    const isNearThreshold = percentage >= (budget.alertThreshold || 80);

    return {
      percentage: Math.min(percentage, 100),
      isOverBudget,
      isNearThreshold,
      remaining: budget.amount - (budget.spent || 0),
    };
  };

  const getPeriodIcon = (period: string) => {
    switch(period) {
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <BarChart3 className="h-4 w-4" />;
      case 'yearly': return <TrendingUp className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your budgets...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Budgets</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <Button onClick={fetchBudgets}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Budgets
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Set and track your spending limits
          </p>
        </div>
        <Button 
          onClick={() => openModal()} 
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus size={20} className="mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Budgets
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {budgets.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Allocated
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const status = getBudgetStatus(budget);
          
          return (
            <Card 
              key={budget.id} 
              className="overflow-hidden transition-all duration-300 hover:shadow-lg border-0 shadow-sm"
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {getPeriodIcon(budget.period)}
                        <span className="ml-1 capitalize">{budget.period}</span>
                        {budget.category && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{budget.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {status.isNearThreshold && (
                      <div className={`p-1 rounded-full ${
                        status.isOverBudget 
                          ? 'bg-red-100 dark:bg-red-900/30' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        <AlertTriangle 
                          className={`h-4 w-4 ${
                            status.isOverBudget 
                              ? 'text-red-500' 
                              : 'text-yellow-500'
                          }`} 
                        />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(budget)}
                      className="rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(budget)}
                      className="rounded-full p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 p-6">
                {/* Budget Overview */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(budget.spent || 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      of {formatCurrency(budget.amount)} budget
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      status.isOverBudget 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {status.isOverBudget ? '-' : ''}
                      {formatCurrency(Math.abs(status.remaining))}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {status.isOverBudget ? 'over budget' : 'remaining'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Progress
                    </span>
                    <span className={`font-medium ${
                      status.isOverBudget 
                        ? 'text-red-600 dark:text-red-400'
                        : status.isNearThreshold
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                    }`}>
                      {Math.round(((budget.spent || 0) / budget.amount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        status.isOverBudget 
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : status.isNearThreshold
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Alerts */}
                {status.isOverBudget && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      You've exceeded your budget by {formatCurrency(Math.abs(status.remaining))}
                    </p>
                  </div>
                )}
                {status.isNearThreshold && !status.isOverBudget && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      You're approaching your budget limit ({Math.round(((budget.spent || 0) / budget.amount) * 100)}%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No budgets yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
              Set spending limits and track your financial goals by creating your first budget.
            </p>
            <Button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus size={20} className="mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <DollarSign className="h-4 w-4" />
            </div>
            <Input
              label="Budget Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              error={errors.amount}
              placeholder="0.00"
              required
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 transition-colors"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Period
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'weekly' | 'monthly' | 'yearly' }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 transition-colors"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Calendar className="h-4 w-4" />
              </div>
              <Input
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                error={errors.start_date}
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Calendar className="h-4 w-4" />
              </div>
              <Input
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                error={errors.end_date}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {editingBudget ? 'Update' : 'Create'} Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, budget: null })}
        title="Delete Budget"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Delete Budget
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "{deleteModal.budget?.name}"? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, budget: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Budget
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};