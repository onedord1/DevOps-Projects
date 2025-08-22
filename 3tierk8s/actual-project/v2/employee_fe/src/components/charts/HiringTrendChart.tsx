import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Employee } from '../../types/Employee';
import { format, subMonths, startOfMonth } from 'date-fns';

interface HiringTrendChartProps {
  employees: Employee[];
}

export default function HiringTrendChart({ employees }: HiringTrendChartProps) {
  // Generate last 12 months of data
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = startOfMonth(subMonths(new Date(), 11 - i));
    return {
      month: format(date, 'MMM yyyy'),
      date: date,
      hires: 0
    };
  });

  // Count hires per month
  employees.forEach(emp => {
    const hireDate = new Date(emp.hireDate);
    const monthIndex = months.findIndex(m => 
      m.date.getMonth() === hireDate.getMonth() && 
      m.date.getFullYear() === hireDate.getFullYear()
    );
    if (monthIndex !== -1) {
      months[monthIndex].hires += 1;
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-emerald-600">
            {payload[0].value} new hire{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiring Trends (Last 12 Months)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={months} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="hires" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}