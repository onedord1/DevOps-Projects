import React, { useState } from 'react';
import { Plus, Edit, Trash2, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  categoryId?: string;
  categoryName?: string;
  period: 'monthly' | 'yearly';
  alertThreshold: number;
  startDate: string;
  endDate: string;
}

const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Monthly Food Budget',
    amount: 500,
    spent: 450,
    categoryName: 'Food & Dining',
    period: 'monthly',
    alertThreshold: 80,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  },
  {
    id: '2',
    name: 'Transportation',
    amount: 300,
    spent: 195,
    categoryName: 'Transportation',
    period: 'monthly',
    alertThreshold: 75,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  },
  {
    id: '3',
    name: 'Entertainment Budget',
    amount: 200,
    spent: 175,
    categoryName: 'Entertainment',
    period: 'monthly',
    alertThreshold: 85,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  },
];

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; budget: Budget | null }>({
    isOpen: false,
    budget: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly',
    alertThreshold: '80',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      period: 'monthly',
      alertThreshold: '80',
    });
    setErrors({});
    setEditingBudget(null);
  };

  const openModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        amount: budget.amount.toString(),
        period: budget.period,
        alertThreshold: budget.alertThreshold.toString(),
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

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.alertThreshold || 
        parseFloat(formData.alertThreshold) < 0 || 
        parseFloat(formData.alertThreshold) > 100) {
      newErrors.alertThreshold = 'Alert threshold must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    if (editingBudget) {
      // Update existing budget
      setBudgets(prev =>
        prev.map(budget =>
          budget.id === editingBudget.id
            ? {
                ...budget,
                name: formData.name,
                amount: parseFloat(formData.amount),
                period: formData.period,
                alertThreshold: parseFloat(formData.alertThreshold),
              }
            : budget
        )
      );
    } else {
      // Create new budget
      const newBudget: Budget = {
        id: Date.now().toString(),
        name: formData.name,
        amount: parseFloat(formData.amount),
        spent: 0,
        period: formData.period,
        alertThreshold: parseFloat(formData.alertThreshold),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
      setBudgets(prev => [...prev, newBudget]);
    }

    closeModal();
  };

  const handleDelete = (budget: Budget) => {
    setDeleteModal({ isOpen: true, budget });
  };

  const confirmDelete = () => {
    if (deleteModal.budget) {
      setBudgets(prev => prev.filter(budget => budget.id !== deleteModal.budget!.id));
    }
    setDeleteModal({ isOpen: false, budget: null });
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    const isOverBudget = percentage > 100;
    const isNearThreshold = percentage >= budget.alertThreshold;

    return {
      percentage: Math.min(percentage, 100),
      isOverBudget,
      isNearThreshold,
      remaining: budget.amount - budget.spent,
    };
  };

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
                      {formatCurrency(budget.spent)}
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
                      {Math.round((budget.spent / budget.amount) * 100)}%
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
                  {budget.categoryName && <span>Category: {budget.categoryName}</span>}
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
                      💡 You're approaching your budget limit ({Math.round((budget.spent / budget.amount) * 100)}%)
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
            label="Budget Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            placeholder="e.g., Monthly Food Budget"
            required
          />

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
              Period
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'monthly' | 'yearly' }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <Input
            label="Alert Threshold (%)"
            type="number"
            min="0"
            max="100"
            value={formData.alertThreshold}
            onChange={(e) => setFormData(prev => ({ ...prev, alertThreshold: e.target.value }))}
            error={errors.alertThreshold}
            helperText="Get notified when you reach this percentage of your budget"
            placeholder="80"
            required
          />

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