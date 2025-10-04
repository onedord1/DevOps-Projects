import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MetricSeries } from '@/types';
import { format } from 'date-fns';

interface MetricsChartProps {
  title: string;
  series: MetricSeries[];
  height?: number;
}

export function MetricsChart({ title, series, height = 300 }: MetricsChartProps) {
  if (!series || series.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const allPoints = series.flatMap(s => s.points);
  const uniqueTimestamps = [...new Set(allPoints.map(p => p.timestamp))].sort();

  const chartData = uniqueTimestamps.map(timestamp => {
    const dataPoint: any = { timestamp };
    series.forEach(s => {
      const point = s.points.find(p => p.timestamp === timestamp);
      dataPoint[s.metricName] = point?.value || null;
    });
    return dataPoint;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm:ss')}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            {series.map((s, index) => (
              <Line
                key={s.metricName}
                type="monotone"
                dataKey={s.metricName}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
