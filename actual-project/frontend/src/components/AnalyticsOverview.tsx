import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { Employee } from '../types/Employee';

interface AnalyticsOverviewProps {
  employees: Employee[];
}

export default function AnalyticsOverview({ employees }: AnalyticsOverviewProps) {
  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const averageSalary = totalSalary / employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const retentionRate = (activeEmployees / employees.length) * 100;

  const metrics = [
    {
      title: 'Total Payroll',
      value: `$${(totalSalary / 1000000).toFixed(1)}M`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Average Salary',
      value: `$${Math.round(averageSalary).toLocaleString()}`,
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Retention Rate',
      value: `${retentionRate.toFixed(1)}%`,
      change: '-2.1%',
      trend: 'down',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Growth Rate',
      value: '15.3%',
      change: '+5.7%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-sm border-2 ${metric.borderColor} p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <TrendIcon className="h-4 w-4" />
                <span className="font-medium">{metric.change}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}