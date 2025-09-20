import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/format';
import { apiService } from '../services/api';

// Define interfaces for the expense data
interface ExpenseTag {
  id: string;
  name: string;
  color: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
  tags: ExpenseTag[];
  currency?: string;
  receipt?: string;
}

export const ExpensesList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; expense: Expense | null }>({ 
    isOpen: false, 
    expense: null 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    minAmount: '',
    maxAmount: '',
  });

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getExpenses();
      console.log('API Response:', response);
      setExpenses(response.data || []);
      setFilteredExpenses(response.data || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError('Failed to load expenses. Please try again later.');
      // Fallback to empty array if API fails
      setExpenses([]);
      setFilteredExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Apply filters when expenses, search query, or filter values change
  useEffect(() => {
    let filtered = expenses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filters
    if (filters.startDate) {
      filtered = filtered.filter(expense => expense.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(expense => expense.date <= filters.endDate);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(expense => 
        expense.category.name.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(expense => expense.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(expense => expense.amount <= parseFloat(filters.maxAmount));
    }

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [expenses, searchQuery, filters]);

  const handleDeleteExpense = (expense: Expense) => {
    setDeleteModal({ isOpen: true, expense });
  };

  const confirmDelete = async () => {
    if (deleteModal.expense) {
      try {
        await apiService.deleteExpense(deleteModal.expense.id);
        // Refresh the expenses list after successful deletion
        await fetchExpenses();
      } catch (err) {
        console.error('Failed to delete expense:', err);
        setError('Failed to delete expense. Please try again.');
      } finally {
        setDeleteModal({ isOpen: false, expense: null });
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchQuery('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage and track your expenses
          </p>
        </div>
        <Link to="/expenses/new">
          <Button className="mt-4 sm:mt-0">
            <Plus size={20} className="mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} className="mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
                <Input
                  placeholder="Category"
                  label="Category"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Min Amount"
                  label="Min Amount"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Max Amount"
                  label="Max Amount"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Loading...' : `${filteredExpenses.length} Expense${filteredExpenses.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedExpenses.map((expense) => (
                  <div key={expense.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {expense.description}
                            </h3>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(expense.date)}
                              </div>
                              <div className="flex items-center">
                                <div 
                                  className="h-3 w-3 rounded-full mr-2"
                                  style={{ backgroundColor: expense.category.color }}
                                />
                                {expense.category.icon} {expense.category.name}
                              </div>
                            </div>
                            {expense.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {expense.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ 
                                      backgroundColor: `${tag.color}20`,
                                      color: tag.color
                                    }}
                                  >
                                    <TagIcon className="h-3 w-3 mr-1" />
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(expense.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex justify-end space-x-2">
                      <Link to={`/expenses/edit/${expense.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteExpense(expense)}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredExpenses.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No expenses found matching your criteria.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, expense: null })}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete "{deleteModal.expense?.description}"? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, expense: null })}
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