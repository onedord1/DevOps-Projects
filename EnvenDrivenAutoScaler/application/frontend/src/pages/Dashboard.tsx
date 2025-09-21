// Dashboard.tsx - Enhanced version
import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Receipt,
  Plus,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon
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
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const stats = dashboardData;
  
  // Calculate percentage change (mock data for demonstration)
  const monthlyChange = 12.5; // Positive percentage
  const weeklyChange = -5.2; // Negative percentage

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Here's an overview of your expenses and financial activity
          </p>
        </div>
        <Link to="/expenses/new">
          <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus size={20} className="mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">8.2%</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.monthlyTotal)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              {monthlyChange >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400 font-medium">{Math.abs(monthlyChange)}%</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{Math.abs(monthlyChange)}%</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.weeklyTotal)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              {weeklyChange >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400 font-medium">{Math.abs(weeklyChange)}%</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">from last week</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{Math.abs(weeklyChange)}%</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">from last week</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.transactionCount}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">12%</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-4">
            <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                        animationDuration={1000}
                        animationBegin={0}
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="" />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'Amount']} 
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4 max-h-40 overflow-y-auto pr-2">
                  {stats.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                <PieChartIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 pb-4">
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
              <BarChart3 className="h-5 w-5 mr-2" />
              Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.monthlyTrend.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Amount']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={config.CHART_COLORS[0]} 
                      strokeWidth={3}
                      dot={{ fill: config.CHART_COLORS[0], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1000}
                      animationBegin={0}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p>No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 pb-4">
          <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
            <Target className="h-5 w-5 mr-2" />
            Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {stats.budgetStatus.length > 0 ? (
            <div className="space-y-6">
              {stats.budgetStatus.map((budget, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {budget.budgetName}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        budget.percentage > 90 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : budget.percentage > 75 
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {budget.percentage}% used
                    </span>
                    {budget.percentage > 90 && (
                      <span className="flex items-center text-red-600 dark:text-red-400 font-medium">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Over budget!
                      </span>
                    )}
                    {budget.percentage > 75 && budget.percentage <= 90 && (
                      <span className="flex items-center text-yellow-600 dark:text-yellow-400 font-medium">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Approaching limit
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Target className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p>No budget data available</p>
              <Link to="/budgets" className="inline-block mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Create your first budget
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};