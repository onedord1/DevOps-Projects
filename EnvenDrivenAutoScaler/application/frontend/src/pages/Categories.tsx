// Categories.tsx - Enhanced version
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { config } from '../config';
import { apiService } from '../services/api';

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
  icon: string;
  expenseCount?: number;
  totalAmount?: number;
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    color: config.CHART_COLORS[0],
    type: 'expense', // Default to expense type
    icon: '💰', // Default icon
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories from API on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: config.CHART_COLORS[0],
      type: 'expense',
      icon: '💰',
    });
    setErrors({});
    setEditingCategory(null);
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color,
        type: category.type,
        icon: category.icon || '💰',
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
      newErrors.name = 'Category name is required';
    }

    if (!formData.color) {
      newErrors.color = 'Color is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.icon.trim()) {
      newErrors.icon = 'Icon is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, {
          name: formData.name,
          color: formData.color,
          type: formData.type as any,
          icon: formData.icon,
        });
      } else {
        await apiService.createCategory({
          name: formData.name,
          color: formData.color,
          type: formData.type as any,
          icon: formData.icon,
        });
      }

      await fetchCategories();
      closeModal();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = (category: Category) => {
    setDeleteModal({ isOpen: true, category });
  };

  const confirmDelete = async () => {
    if (deleteModal.category) {
      try {
        await apiService.deleteCategory(deleteModal.category.id);
        await fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
    setDeleteModal({ isOpen: false, category: null });
  };

  // Calculate statistics
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const totalExpenses = expenseCategories.reduce((sum, cat) => sum + (cat.totalAmount || 0), 0);
  const totalIncome = incomeCategories.reduce((sum, cat) => sum + (cat.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Organize your expenses with custom categories
          </p>
        </div>
        <Button 
          onClick={() => openModal()} 
          className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <Plus size={20} className="mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Expense Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {expenseCategories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Income Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {incomeCategories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading categories...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg border-0 shadow-sm"
                >
                  <CardHeader 
                    className="pb-3"
                    style={{ 
                      background: `linear-gradient(to right, ${category.color}20, ${category.color}10)` 
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-5 h-5 rounded-full mr-3 border border-white/30"
                          style={{ backgroundColor: category.color }}
                        />
                        <CardTitle className="text-lg flex items-center">
                          <span className="mr-2 text-xl">{category.icon}</span>
                          {category.name}
                        </CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openModal(category)}
                          className="rounded-full p-1.5 hover:bg-white/20"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(category)}
                          className="rounded-full p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Type:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        category.type === 'income' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {category.type === 'income' ? (
                          <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Income
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Expense
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {category.expenseCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Transactions:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.expenseCount}
                        </span>
                      </div>
                    )}
                    
                    {category.totalAmount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Amount:</span>
                        <span className={`font-medium ${
                          category.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {category.type === 'income' ? '+' : '-'}
                          ${Math.abs(category.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Visual indicator for usage */}
                    <div className="pt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, ((category.expenseCount || 0) / 10) * 100)}%`,
                            backgroundColor: category.color 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                        {category.expenseCount || 0} transactions
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <Palette className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No categories yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                  Get started by creating your first expense category to better organize your finances.
                </p>
                <Button 
                  onClick={() => openModal()} 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Plus size={20} className="mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Palette className="h-4 w-4" />
            </div>
            <Input
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={errors.name}
              placeholder="e.g., Food & Dining"
              required
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              >
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                <span className="text-red-600 dark:text-red-400 font-medium">Expense</span>
              </button>
              <button
                type="button"
                className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              >
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">Income</span>
              </button>
            </div>
            {errors.type && (
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Icon
            </label>
            <div className="flex items-center">
              <div className="mr-3 text-2xl">{formData.icon}</div>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                error={errors.icon}
                placeholder="💰"
                maxLength={2}
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter an emoji (max 2 characters)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {config.CHART_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-900 dark:border-white scale-110 shadow-sm'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.color}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Delete Category
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "{deleteModal.category?.name}"? 
              This will remove the category from {deleteModal.category?.expenseCount || 0} expenses.
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, category: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};