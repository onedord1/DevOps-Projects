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

// Mock data for demonstration
const mockStats = {
  totalExpenses: 2847.50,
  monthlyTotal: 1245.75,
  weeklyTotal: 387.25,
  categoryBreakdown: [
    { categoryName: 'Food & Dining', amount: 450.00, color: config.CHART_COLORS[0] },
    { categoryName: 'Transportation', amount: 280.50, color: config.CHART_COLORS[1] },
    { categoryName: 'Shopping', amount: 320.25, color: config.CHART_COLORS[2] },
    { categoryName: 'Entertainment', amount: 195.00, color: config.CHART_COLORS[3] },
    { categoryName: 'Bills & Utilities', amount: 450.00, color: config.CHART_COLORS[4] },
  ],
  monthlyTrend: [
    { month: 'Jan', amount: 1200 },
    { month: 'Feb', amount: 1350 },
    { month: 'Mar', amount: 1100 },
    { month: 'Apr', amount: 1450 },
    { month: 'May', amount: 1300 },
    { month: 'Jun', amount: 1246 },
  ],
  budgetStatus: [
    { budgetName: 'Monthly Budget', spent: 1246, total: 1500, percentage: 83 },
    { budgetName: 'Food Budget', spent: 450, total: 500, percentage: 90 },
    { budgetName: 'Entertainment', spent: 195, total: 300, percentage: 65 },
  ],
};

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(mockStats);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch data from multiple endpoints
        const [summaryResponse, trendsResponse, categoryResponse, budgetResponse] = await Promise.all([
          apiService.getReportsSummary(),
          apiService.getReportsTrends(),
          apiService.getCategoryBreakdown(),
          apiService.getBudgetAnalysis(),
        ]);
        
        // Process and combine the data
        // For now, we'll use mock data but you can process the real data here
        setDashboardData(mockStats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Use mock data as fallback
        setDashboardData(mockStats);
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
                  47
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
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};