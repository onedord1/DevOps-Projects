import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Receipt,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import { config } from '../config';
import { apiService } from '../services/api';

// Define the types for our dashboard data
interface DashboardStats {
  totalExpenses: number;
  monthlyTotal: number;
  weeklyTotal: number;
  transactionCount: number;
  categoryBreakdown: Array<{
    categoryName: string;
    amount: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
  budgetStatus: Array<{
    budgetName: string;
    spent: number;
    total: number;
    percentage: number;
  }>;
}

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    totalExpenses: 0,
    monthlyTotal: 0,
    weeklyTotal: 0,
    transactionCount: 0,
    categoryBreakdown: [],
    monthlyTrend: [],
    budgetStatus: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch data from multiple endpoints with error handling for each
        let summaryData: any = {};
        let trendsData: any = {};
        let categoryData: any = {};
        let budgetData: any = {};
        
        try {
          const summaryResponse = await apiService.getReportsSummary();
          summaryData = summaryResponse.data || {};
        } catch (err) {
          console.error('Error fetching summary data:', err);
        }
        
        try {
          const trendsResponse = await apiService.getReportsTrends();
          trendsData = trendsResponse.data || {};
        } catch (err) {
          console.error('Error fetching trends data:', err);
        }
        
        try {
          const categoryResponse = await apiService.getCategoryBreakdown();
          categoryData = categoryResponse.data || {};
        } catch (err) {
          console.error('Error fetching category data:', err);
        }
        
        try {
          const budgetResponse = await apiService.getBudgetAnalysis();
          budgetData = budgetResponse.data || {};
        } catch (err) {
          console.error('Error fetching budget data:', err);
        }
        
        // Process summary data with fallbacks
        const totalExpenses = summaryData.totalExpenses || 0;
        const monthlyTotal = summaryData.monthlyTotal || 0;
        const weeklyTotal = summaryData.weeklyTotal || 0;
        const transactionCount = summaryData.transactionCount || 0;
        
        // Process category breakdown data with better error handling
        let categoryBreakdown = [];
        if (Array.isArray(categoryData)) {
          categoryBreakdown = categoryData.map((category: any, index: number) => ({
            categoryName: category.name || category.categoryName || 'Unknown',
            amount: category.total || category.amount || 0,
            color: config.CHART_COLORS[index % config.CHART_COLORS.length],
          }));
        } else if (categoryData && typeof categoryData === 'object') {
          // Handle case where categoryData might be an object with category names as keys
          categoryBreakdown = Object.entries(categoryData).map(([name, amount], index) => ({
            categoryName: name,
            amount: typeof amount === 'number' ? amount : 0,
            color: config.CHART_COLORS[index % config.CHART_COLORS.length],
          }));
        }
        
        // Process monthly trend data with better error handling
        let monthlyTrend = [];
        if (Array.isArray(trendsData)) {
          monthlyTrend = trendsData.map((trend: any) => ({
            month: trend.month || 'Unknown',
            amount: trend.total || trend.amount || 0,
          }));
        } else if (trendsData && typeof trendsData === 'object') {
          // Handle case where trendsData might be an object with month names as keys
          monthlyTrend = Object.entries(trendsData).map(([month, amount]) => ({
            month,
            amount: typeof amount === 'number' ? amount : 0,
          }));
        }
        
        // Process budget status data with better error handling
        let budgetStatus = [];
        if (Array.isArray(budgetData)) {
          budgetStatus = budgetData.map((budget: any) => ({
            budgetName: budget.name || 'Budget',
            spent: budget.spent || 0,
            total: budget.amount || budget.total || 0,
            percentage: budget.amount ? Math.round((budget.spent / budget.amount) * 100) : 0,
          }));
        } else if (budgetData && typeof budgetData === 'object') {
          // Handle case where budgetData might be an object with budget names as keys
          budgetStatus = Object.entries(budgetData).map(([name, data]: [string, any]) => ({
            budgetName: name,
            spent: data.spent || 0,
            total: data.amount || data.total || 0,
            percentage: data.amount ? Math.round((data.spent / data.amount) * 100) : 0,
          }));
        }
        
        // Combine all processed data
        setDashboardData({
          totalExpenses,
          monthlyTotal,
          weeklyTotal,
          transactionCount,
          categoryBreakdown,
          monthlyTrend,
          budgetStatus,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const stats = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Here's an overview of your expenses
          </p>
        </div>
        <Link to="/expenses/new">
          <Button className="mt-4 sm:mt-0">
            <Plus size={20} className="mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.monthlyTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.weeklyTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.transactionCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryBreakdown.length > 0 ? (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="amount"
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {stats.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {category.categoryName}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyTrend.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis formatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={config.CHART_COLORS[0]} 
                      strokeWidth={3}
                      dot={{ fill: config.CHART_COLORS[0], strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.budgetStatus.length > 0 ? (
            <div className="space-y-4">
              {stats.budgetStatus.map((budget, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {budget.budgetName}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        budget.percentage > 90 
                          ? 'bg-red-600' 
                          : budget.percentage > 75 
                            ? 'bg-yellow-600' 
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {budget.percentage}% used
                    </span>
                    {budget.percentage > 90 && (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Over budget!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No budget data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};