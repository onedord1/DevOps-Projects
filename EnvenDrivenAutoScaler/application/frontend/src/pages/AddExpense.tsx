// AddExpense.tsx - Enhanced version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Tag, 
  Upload, 
  Repeat, 
  X, 
  Check,
  AlertCircle,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
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
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const formattedDate = localDate.toISOString();

      // Convert tags array to comma-separated string
      const tagsString = formData.tags.length > 0 ? formData.tags.join(',') : '';

      // Create expense data with explicit typing
      const expenseData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formattedDate,
        categoryId: formData.categoryId,
        currency: formData.currency,
        tags: tagsString,
        receipt: receiptUrl,
        recurring: formData.isRecurring ? {
          frequency: formData.recurringFrequency,
          interval: 1,
          endDate: formData.recurringEndDate || undefined,
        } : undefined,
      };
      
      await apiService.createExpense(expenseData);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/expenses');
      }, 1500);
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

  const handleCategorySelect = (categoryId: string) => {
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
      // Simple file validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size exceeds 5MB limit');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      
      setFormData(prev => ({ ...prev, receipt: file }));
    }
  };

  const removeReceipt = () => {
    setFormData(prev => ({ ...prev, receipt: null }));
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);

      const response = await apiService.uploadReceipt(file);
      return response.data.url;
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      return null;
    } finally {
      setUploadProgress(0);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch(currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      default: return '$';
    }
  };

  // Success overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Expense Added Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your expense has been recorded and you're being redirected.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-green-600 h-2.5 rounded-full w-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add New Expense
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Record a new expense transaction
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/expenses')}
          className="hidden sm:flex"
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
              <DollarSign className="h-5 w-5 mr-2" />
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  {getCurrencySymbol(formData.currency)}
                </div>
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
                  className="pl-8"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
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
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <Input
                  name="date"
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={handleChange}
                  error={errors.date}
                  required
                  className="pl-10"
                />
              </div>
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
              characterLimit={100}
            />
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardTitle className="text-purple-700 dark:text-purple-300">Category</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {categoriesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                      formData.categoryId === category.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm transform -translate-y-0.5'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full mb-2" style={{ backgroundColor: `${category.color}20` }}>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  No categories available. Please create categories first.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/categories')}
                >
                  Manage Categories
                </Button>
              </div>
            )}
            {errors.categoryId && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.categoryId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tags Selection */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
              <Tag className="h-5 w-5 mr-2" />
              Tags (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {tagsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center ${
                      formData.tags.includes(tag.id)
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {formData.tags.includes(tag.id) && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-300">
                  No tags available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Upload */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <CardTitle className="flex items-center text-emerald-700 dark:text-emerald-300">
              <Upload className="h-5 w-5 mr-2" />
              Receipt (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!formData.receipt ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center transition-colors hover:border-emerald-400 dark:hover:border-emerald-600">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="receipt" className="cursor-pointer">
                    <span className="block text-lg font-medium text-gray-900 dark:text-white mb-1">
                      Upload receipt
                    </span>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">
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
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mr-3">
                      {formData.receipt.type.startsWith('image/') ? (
                        <ImageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formData.receipt.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(formData.receipt.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeReceipt}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recurring Options */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
            <CardTitle className="flex items-center text-cyan-700 dark:text-cyan-300">
              <Repeat className="h-5 w-5 mr-2" />
              Recurring Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center">
              <input
                id="isRecurring"
                name="isRecurring"
                type="checkbox"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded transition-colors"
              />
              <label htmlFor="isRecurring" className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                This is a recurring expense
              </label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pl-1 border-l-2 border-cyan-200 dark:border-cyan-800">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    name="recurringFrequency"
                    value={formData.recurringFrequency}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 transition-colors"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Input
                    name="recurringEndDate"
                    type="date"
                    label="End Date (Optional)"
                    value={formData.recurringEndDate}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expenses')}
            className="sm:hidden"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Add Expense
          </Button>
        </div>
      </form>
    </div>
  );
};