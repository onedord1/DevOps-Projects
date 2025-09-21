// ExpensesList.tsx - Enhanced version
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
  ChevronRight,
  X,
  FileText,
  Image,
  AlertCircle,
  ArrowUpDown,
  DollarSign,
  Hash
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof Expense; direction: 'ascending' | 'descending' } | null>(null);

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

  // Apply sorting
  const requestSort = (key: keyof Expense) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to filtered expenses
  const getSortedExpenses = () => {
    if (!sortConfig) return filteredExpenses;
    
    return [...filteredExpenses].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

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
  const sortedExpenses = getSortedExpenses();
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = sortedExpenses.slice(startIndex, startIndex + itemsPerPage);

  // Calculate total amount of filtered expenses
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage and track your expenses
          </p>
        </div>
        <Link to="/expenses/new">
          <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus size={20} className="mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {filteredExpenses.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Hash className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Average Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {filteredExpenses.length > 0 ? formatCurrency(totalAmount / filteredExpenses.length) : formatCurrency(0)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <ArrowUpDown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm overflow-hidden">
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
              className={`${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}`}
            >
              <Filter size={20} className="mr-2" />
              Filters
              {showFilters && (
                <X size={16} className="ml-2" />
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-3 top-9 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-9 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    label="End Date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <Input
                  placeholder="Category"
                  label="Category"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                />
                <div className="relative">
                  <DollarSign className="absolute left-3 top-9 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="Min Amount"
                    label="Min Amount"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-9 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="Max Amount"
                    label="Max Amount"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="pl-10"
                  />
                </div>
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
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>
              {isLoading ? 'Loading...' : `${filteredExpenses.length} Expense${filteredExpenses.length !== 1 ? 's' : ''}`}
            </span>
            {filteredExpenses.length > 0 && (
              <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                Total: {formatCurrency(totalAmount)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading your expenses...</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedExpenses.map((expense) => (
                  <div key={expense.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {expense.description}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(expense.date)}
                              </div>
                              <div className="flex items-center">
                                <div 
                                  className="h-3 w-3 rounded-full mr-2"
                                  style={{ backgroundColor: expense.category.color }}
                                />
                                <span className="mr-1">{expense.category.icon}</span>
                                {expense.category.name}
                              </div>
                              {expense.receipt && (
                                <div className="flex items-center">
                                  {expense.receipt.endsWith('.pdf') ? (
                                    <FileText className="h-4 w-4 mr-1" />
                                  ) : (
                                    <Image className="h-4 w-4 mr-1" />
                                  )}
                                  <span>Receipt</span>
                                </div>
                              )}
                            </div>
                            {expense.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {expense.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{ 
                                      backgroundColor: `${tag.color}20`,
                                      color: tag.color,
                                      border: `1px solid ${tag.color}40`
                                    }}
                                  >
                                    <TagIcon className="h-3 w-3 mr-1" />
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
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
                        <Button variant="outline" size="sm" className="rounded-full">
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteExpense(expense)}
                        className="rounded-full"
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
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No expenses found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    No expenses match your search criteria or you haven't added any expenses yet.
                  </p>
                  <Link to="/expenses/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Plus size={20} className="mr-2" />
                      Add Your First Expense
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedExpenses.length)} of {sortedExpenses.length} expenses
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-full"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-full ${currentPage === pageNum ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, expense: null })}
        title="Delete Expense"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Delete Expense
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "{deleteModal.expense?.description}"? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, expense: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};