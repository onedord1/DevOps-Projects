import React, { useState } from 'react';
import { Calendar, Download, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import { config } from '../config';
import { apiService } from '../services/api';

// Mock data for reports
const mockData = {
  monthlyTrend: [
    { month: 'Jul', amount: 1150, income: 3000 },
    { month: 'Aug', amount: 1280, income: 3000 },
    { month: 'Sep', amount: 1100, income: 3200 },
    { month: 'Oct', amount: 1420, income: 3200 },
    { month: 'Nov', amount: 1350, income: 3100 },
    { month: 'Dec', amount: 1480, income: 3300 },
    { month: 'Jan', amount: 1246, income: 3250 },
  ],
  categoryComparison: [
    { category: 'Food', thisMonth: 450, lastMonth: 380 },
    { category: 'Transport', thisMonth: 280, lastMonth: 320 },
    { category: 'Shopping', thisMonth: 320, lastMonth: 250 },
    { category: 'Entertainment', thisMonth: 195, lastMonth: 160 },
    { category: 'Bills', thisMonth: 450, lastMonth: 445 },
  ],
  weeklySpending: [
    { week: 'Week 1', amount: 320 },
    { week: 'Week 2', amount: 280 },
    { week: 'Week 3', amount: 350 },
    { week: 'Week 4', amount: 296 },
  ],
  topCategories: [
    { name: 'Food & Dining', amount: 450, color: config.CHART_COLORS[0] },
    { name: 'Bills & Utilities', amount: 450, color: config.CHART_COLORS[4] },
    { name: 'Shopping', amount: 320, color: config.CHART_COLORS[2] },
    { name: 'Transportation', amount: 280, color: config.CHART_COLORS[1] },
    { name: 'Entertainment', amount: 195, color: config.CHART_COLORS[3] },
  ],
};

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  
  const totalExpenses = mockData.topCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const averageDaily = totalExpenses / 31; // Assuming current month
  const lastMonthTotal = mockData.categoryComparison.reduce((sum, cat) => sum + cat.lastMonth, 0);
  const changePercent = ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100;

  const handleExport = async () => {
    try {
      const blob = await apiService.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `expense-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Detailed insights into your spending patterns
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="current-year">Current Year</option>
          </select>
          
          <Button onClick={handleExport} variant="outline">
            <Download size={20} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
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
                <p className="text-sm text-gray-600 dark:text-gray-300">Daily Average</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(averageDaily)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                changePercent >= 0 
                  ? 'bg-red-100 dark:bg-red-900' 
                  : 'bg-green-100 dark:bg-green-900'
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  changePercent >= 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">vs Last Month</p>
                <p className={`text-2xl font-bold ${
                  changePercent >= 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <PieChartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockData.topCategories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend (7 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis formatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(value as number), 
                      name === 'amount' ? 'Expenses' : 'Income'
                    ]} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stackId="1"
                    stroke={config.CHART_COLORS[0]} 
                    fill={config.CHART_COLORS[0]}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                    data={mockData.topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {mockData.topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {mockData.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {category.name}
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

        {/* Category Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Month-over-Month Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.categoryComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis formatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                  <Bar 
                    dataKey="lastMonth" 
                    fill={config.CHART_COLORS[1]} 
                    name="Last Month"
                  />
                  <Bar 
                    dataKey="thisMonth" 
                    fill={config.CHART_COLORS[0]} 
                    name="This Month"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Spending Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData.weeklySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis formatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={config.CHART_COLORS[2]} 
                    strokeWidth={3}
                    dot={{ fill: config.CHART_COLORS[2], strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Spending Pattern Analysis
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Your highest spending categories are Food & Dining and Bills & Utilities. 
                Consider setting stricter budgets for discretionary spending like Entertainment and Shopping.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ Positive Trends
              </h4>
              <p className="text-green-800 dark:text-green-200 text-sm">
                Your transportation costs decreased by $40 compared to last month. 
                This shows good progress in optimizing your commute expenses.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ Areas for Improvement
              </h4>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Shopping expenses increased by 28% this month. Consider reviewing recent purchases 
                and identifying opportunities to reduce non-essential spending.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};