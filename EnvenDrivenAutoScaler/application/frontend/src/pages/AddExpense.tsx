import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Tag, Upload, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiService } from '../services/api';

// Define the Category interface based on API response
interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
  icon: string;
}

// Define the Tag interface
interface Tag {
  id: string;
  name: string;
  color: string;
}

export const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '', // Changed to string to match API
    currency: 'USD',
    tags: [] as string[],
    receipt: null as File | null,
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringEndDate: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories from API on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await apiService.getCategories();
        // Filter only expense categories since this is an expense form
        const expenseCategories = response.data.filter(
          (category: Category) => category.type === 'expense'
        );
        setCategories(expenseCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to empty array if API fails
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Fetch tags from API
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await apiService.getTags();
        setTags(response.data || []);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        // Fallback to empty array if API fails
        setTags([]);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchCategories();
    fetchTags();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.categoryId) { // Changed check for empty string instead of 0
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form data before validation:', formData);
    console.log('Selected tags:', formData.tags);
    
    // Final validation check before submitting
    if (!formData.categoryId) { // Changed check for empty string instead of 0
      console.error('Category ID is empty');
      setErrors({ categoryId: 'Category is required' });
      return;
    }
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let receiptUrl = null;
      
      // Upload receipt if provided
      if (formData.receipt) {
        receiptUrl = await uploadReceipt(formData.receipt);
      }

      // Format the date to include time and timezone
      const date = new Date(formData.date);
      // Set to midnight in the local timezone
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      // Convert to ISO string (includes time and timezone)
      const formattedDate = localDate.toISOString();

      // Convert tags array to comma-separated string
      const tagsString = formData.tags.length > 0 ? formData.tags.join(',') : '';
      
      console.log('Tags string to be sent:', tagsString);

      // Create expense data with explicit typing
      const expenseData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formattedDate,
        categoryId: formData.categoryId, // Already a string from API
        currency: formData.currency,
        tags: tagsString,
        receipt: receiptUrl,
        recurring: formData.isRecurring ? {
          frequency: formData.recurringFrequency,
          interval: 1,
          endDate: formData.recurringEndDate || undefined,
        } : undefined,
      };

      console.log('Expense data to be sent:', expenseData);
      
      await apiService.createExpense(expenseData);
      
      navigate('/expenses');
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySelect = (categoryId: string) => { // Changed parameter type to string
    console.log('Selected category ID:', categoryId);
    setFormData(prev => ({ ...prev, categoryId }));
  };

  const handleTagToggle = (tagId: string) => {
    console.log('Toggling tag:', tagId);
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, receipt: file }));
    }
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const response = await apiService.uploadReceipt(file);
      return response.data.url;
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Expense
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Record a new expense transaction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="amount"
                type="number"
                step="0.01"
                label="Amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                error={errors.amount}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              
              <Input
                name="date"
                type="date"
                label="Date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
              />
            </div>

            <Input
              name="description"
              type="text"
              label="Description"
              placeholder="What did you spend on?"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              required
            />
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.categoryId === category.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.icon} {category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-300">
                  No categories available. Please create categories first.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/categories')}
                >
                  Manage Categories
                </Button>
              </div>
            )}
            {errors.categoryId && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.categoryId}</p>
            )}
          </CardContent>
        </Card>

        {/* Tags Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Tags (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tagsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      formData.tags.includes(tag.id)
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-300">
                  No tags available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Receipt (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="receipt" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Upload receipt
                    </span>
                    <span className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, PDF up to 5MB
                    </span>
                    <input
                      id="receipt"
                      name="receipt"
                      type="file"
                      className="sr-only"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
              {formData.receipt && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">
                  Selected: {formData.receipt.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recurring Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Repeat className="h-5 w-5 mr-2" />
              Recurring Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <input
                id="isRecurring"
                name="isRecurring"
                type="checkbox"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-900 dark:text-white">
                This is a recurring expense
              </label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    name="recurringFrequency"
                    value={formData.recurringFrequency}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <Input
                  name="recurringEndDate"
                  type="date"
                  label="End Date (Optional)"
                  value={formData.recurringEndDate}
                  onChange={handleChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expenses')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
          >
            Add Expense
          </Button>
        </div>
      </form>
    </div>
  );
};