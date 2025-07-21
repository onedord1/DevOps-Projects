import { useState } from 'react';
import { Users, Building, TrendingUp, Calendar } from 'lucide-react';
import { Employee } from '../types/Employee';
import { employeeStats, departments } from '../data/mockData';
import StatsCards from './StatsCards';
import EmployeeList from './EmployeeList';
import AnalyticsOverview from './AnalyticsOverview';
import DepartmentChart from './charts/DepartmentChart';
import SalaryChart from './charts/SalaryChart';
import HiringTrendChart from './charts/HiringTrendChart';
import StatusDistribution from './charts/StatusDistribution';

interface DashboardProps {
  employees: Employee[];
  onUpdateEmployee: (id: string, employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
}

export default function Dashboard({ 
  employees, 
  onUpdateEmployee, 
  onDeleteEmployee, 
  onAddEmployee 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'departments'>('employees');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'departments', name: 'Departments', icon: Building },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Employee Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <Calendar className="h-4 w-4 inline mr-1" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <AnalyticsOverview employees={employees} />
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DepartmentChart />
              <StatusDistribution employees={employees} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SalaryChart employees={employees} />
              <HiringTrendChart employees={employees} />
            </div>
            
            {/* Department Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Department Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white p-4 rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {dept.employeeCount}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(dept.employeeCount / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div>
            <AnalyticsOverview employees={employees} />
            <EmployeeList
              employees={employees}
              onUpdateEmployee={onUpdateEmployee}
              onDeleteEmployee={onDeleteEmployee}
              onAddEmployee={onAddEmployee}
            />
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-8">
            {/* Department Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DepartmentChart />
              <SalaryChart employees={employees} />
            </div>
            
            {/* Department Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Department Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-6 rounded-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{dept.name}</h4>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {dept.employeeCount}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Employees</span>
                        <span className="font-medium">{dept.employeeCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm" 
                          style={{ width: `${(dept.employeeCount / 30) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>30 max</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}