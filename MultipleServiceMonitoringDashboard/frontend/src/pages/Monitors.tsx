import { useEffect, useState } from 'react';
import { ServiceGrid } from '@/components/monitors/ServiceGrid';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import type { MonitorDTO } from '@/types';

export function Monitors() {
  const [monitors, setMonitors] = useState<MonitorDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentEnvironment } = useEnvironment();

  useEffect(() => {
    loadMonitors();
  }, [currentEnvironment]);

  const loadMonitors = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<MonitorDTO[]>(
        `${API_ENDPOINTS.MONITORS.BASE}?environment=${currentEnvironment}`
      );
      setMonitors(data);
    } catch (error) {
      console.error('Failed to load monitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMonitor = (id: string) => {
    console.log('Selected monitor:', id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitors</h1>
            <p className="text-muted-foreground">Manage service monitors</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitors</h1>
          <p className="text-muted-foreground">Manage service monitors</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Monitor
        </Button>
      </div>

      <ServiceGrid monitors={monitors} onSelectMonitor={handleSelectMonitor} />
    </div>
  );
}
