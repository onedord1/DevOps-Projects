import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Circle as XCircle, Clock } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { DashboardSummary, MonitorStatus } from '@/types'; // Make sure MonitorStatus is in your types
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  // --- CHANGE: State now holds a list of monitors, not a summary ---
  const [monitors, setMonitors] = useState<MonitorStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentEnvironment } = useEnvironment();

  useEffect(() => {
    loadDashboard();
  }, [currentEnvironment]);

  useWebSocket('monitor_status', () => {
    loadDashboard();
  });

  useWebSocket('alert_triggered', () => {
    loadDashboard();
  });

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      // --- CHANGE: API call now fetches a list of monitors ---
      const data = await apiClient.get<MonitorStatus[]>(
        `${API_ENDPOINTS.DASHBOARD}?environment=${currentEnvironment}`
      );
      setMonitors(data || []); // Ensure it's always an array
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // In case of error, set monitors to empty array to avoid errors in useMemo
      setMonitors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CHANGE: Calculate the summary from the monitor list using useMemo ---
  const summary: DashboardSummary | null = useMemo(() => {
    if (monitors.length === 0) {
      return {
        totalServices: 0,
        healthyCount: 0,
        degradedCount: 0,
        unhealthyCount: 0,
        activeAlerts: 0,
        avgResponseTime: 0,
      };
    }

    const totalServices = monitors.length;
    const healthyCount = monitors.filter(m => m.IsUp).length;
    const unhealthyCount = monitors.filter(m => !m.IsUp).length;
    const degradedCount = 0; // You can add logic for degraded status later
    const activeAlerts = 0; // You would fetch this from the /alerts/active endpoint

    const totalLatency = monitors.reduce((sum, m) => sum + (m.LatestLatencyMs || 0), 0);
    const avgResponseTime = totalServices > 0 ? Math.round(totalLatency / totalServices) : 0;

    return {
      totalServices,
      healthyCount,
      degradedCount,
      unhealthyCount,
      activeAlerts,
      avgResponseTime,
    };
  }, [monitors]); // This will only re-calculate when the `monitors` state changes

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">System overview and status</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary || summary.totalServices === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">System overview and status</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {summary.totalServices === 0 ? "No monitors found for this environment." : "Failed to load dashboard data."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Services',
      value: summary.totalServices,
      icon: Activity,
      color: 'text-blue-500',
    },
    {
      title: 'Healthy',
      value: summary.healthyCount,
      icon: CheckCircle2,
      color: 'text-status-healthy',
    },
    {
      title: 'Degraded',
      value: summary.degradedCount,
      icon: Clock,
      color: 'text-status-degraded',
    },
    {
      title: 'Unhealthy',
      value: summary.unhealthyCount,
      icon: XCircle,
      color: 'text-status-error',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">System overview and status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-degraded" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.activeAlerts}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.avgResponseTime}ms</div>
            <p className="text-sm text-muted-foreground mt-1">
              Across all services
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}