import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';
import { apiService } from '../services/api';

interface Budget {
  id: number;
  user_id: number;
  category_id?: number; // null for overall budget
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
  
  // Frontend-specific calculated fields
  spent?: number; // This will be calculated from transactions
  name?: string; // This will be derived from category or custom name
  alertThreshold?: number; // This will be stored separately or calculated
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
        start_date: budget.start_date.split('T')[0], // Format date for input
        end_date: budget.end_date.split('T')[0], // Format date for input
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
        // Update existing budget
        await apiService.updateBudget(editingBudget.id.toString(), budgetData);
      } else {
        // Create new budget
        await apiService.createBudget(budgetData);
      }

      // Refresh the budgets list
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
        // Refresh the budgets list
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

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={fetchBudgets}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Budgets
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Set and track your spending limits
          </p>
        </div>
        <Button onClick={() => openModal()} className="mt-4 sm:mt-0">
          <Plus size={20} className="mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const status = getBudgetStatus(budget);
          
          return (
            <Card key={budget.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    {status.isNearThreshold && (
                      <AlertTriangle 
                        className={`h-5 w-5 ${
                          status.isOverBudget 
                            ? 'text-red-500' 
                            : 'text-yellow-500'
                        }`} 
                      />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(budget)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(budget)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
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
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        status.isOverBudget 
                          ? 'bg-red-500'
                          : status.isNearThreshold
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Budget Details */}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Period: {budget.period}</span>
                  {budget.category && <span>Category: {budget.category.name}</span>}
                </div>

                {/* Alerts */}
                {status.isOverBudget && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ⚠️ You've exceeded your budget by {formatCurrency(Math.abs(status.remaining))}
                    </p>
                  </div>
                )}
                {status.isNearThreshold && !status.isOverBudget && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      💡 You're approaching your budget limit ({Math.round(((budget.spent || 0) / budget.amount) * 100)}%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No budgets yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Set spending limits and track your financial goals.
            </p>
            <Button onClick={() => openModal()}>
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
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Budget Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            error={errors.amount}
            placeholder="0.00"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Period
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'weekly' | 'monthly' | 'yearly' }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              error={errors.start_date}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              error={errors.end_date}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
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
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete "{deleteModal.budget?.name}"? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, budget: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};