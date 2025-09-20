import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
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
      // Fallback to empty array if API fails
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
        icon: category.icon || '💰', // Use existing icon or default
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
        // Update existing category
        await apiService.updateCategory(editingCategory.id, {
          name: formData.name,
          color: formData.color,
          type: formData.type as any,
          icon: formData.icon,
        });
      } else {
        // Create new category
        await apiService.createCategory({
          name: formData.name,
          color: formData.color,
          type: formData.type as any,
          icon: formData.icon,
        });
      }

      // Refresh the categories list
      await fetchCategories();
      closeModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      // Show error message to user (you could add a toast notification here)
    }
  };

  const handleDelete = (category: Category) => {
    setDeleteModal({ isOpen: true, category });
  };

  const confirmDelete = async () => {
    if (deleteModal.category) {
      try {
        await apiService.deleteCategory(deleteModal.category.id);
        // Refresh the categories list
        await fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
        // Show error message to user
      }
    }
    setDeleteModal({ isOpen: false, category: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Organize your expenses with custom categories
          </p>
        </div>
        <Button onClick={() => openModal()} className="mt-4 sm:mt-0">
          <Plus size={20} className="mr-2" />
          Add Category
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading categories...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        />
                        <CardTitle className="text-lg flex items-center">
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openModal(category)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Type:</span>
                        <span className={`font-medium ${
                          category.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {category.type}
                        </span>
                      </div>
                      {category.expenseCount !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Expenses:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.expenseCount}
                          </span>
                        </div>
                      )}
                      {category.totalAmount !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Total:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${category.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Palette className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No categories yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Get started by creating your first expense category.
                </p>
                <Button onClick={() => openModal()}>
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
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            placeholder="e.g., Food & Dining"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              >
                <span className="text-red-600 dark:text-red-400">Expense</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              >
                <span className="text-green-600 dark:text-green-400">Income</span>
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
            <Input
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              error={errors.icon}
              placeholder="💰"
              maxLength={2}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter an emoji (max 2 characters)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {config.CHART_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-600'
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
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
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete "{deleteModal.category?.name}"? 
            This will remove the category from {deleteModal.category?.expenseCount || 0} expenses.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, category: null })}
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