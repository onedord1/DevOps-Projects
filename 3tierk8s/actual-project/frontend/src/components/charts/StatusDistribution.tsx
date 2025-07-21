import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Employee } from '../../types/Employee';

interface StatusDistributionProps {
  employees: Employee[];
}

export default function StatusDistribution({ employees }: StatusDistributionProps) {
  const statusCounts = employees.reduce((acc, emp) => {
    acc[emp.status] = (acc[emp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    { 
      status: 'Active', 
      count: statusCounts.active || 0, 
      color: '#10B981',
      percentage: ((statusCounts.active || 0) / employees.length * 100).toFixed(1)
    },
    { 
      status: 'On Leave', 
      count: statusCounts['on-leave'] || 0, 
      color: '#F59E0B',
      percentage: ((statusCounts['on-leave'] || 0) / employees.length * 100).toFixed(1)
    },
    { 
      status: 'Inactive', 
      count: statusCounts.inactive || 0, 
      color: '#EF4444',
      percentage: ((statusCounts.inactive || 0) / employees.length * 100).toFixed(1)
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{data.status}</p>
          <p className="text-sm" style={{ color: data.color }}>
            {data.count} employee{data.count !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Employee Status Distribution</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}