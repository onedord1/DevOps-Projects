import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertRuleCard } from '@/components/alerts/AlertRuleCard';
import { AlertCard } from '@/components/alerts/AlertCard';
import { Plus } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import type { AlertRuleDTO, AlertDTO } from '@/types';

export function Alerts() {
  const [rules, setRules] = useState<AlertRuleDTO[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentEnvironment } = useEnvironment();

  useEffect(() => {
    loadData();
  }, [currentEnvironment]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rulesData, alertsData] = await Promise.all([
        apiClient.get<AlertRuleDTO[]>(API_ENDPOINTS.ALERT_RULES.BASE),
        apiClient.get<AlertDTO[]>(API_ENDPOINTS.ALERTS.ACTIVE),
      ]);
      setRules(rulesData);
      setActiveAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await apiClient.put(API_ENDPOINTS.ALERT_RULES.BY_ID(ruleId), { enabled });
      setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.ALERTS.ACKNOWLEDGE(alertId));
      await loadData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alerts</h1>
            <p className="text-muted-foreground">Manage alert rules and active alerts</p>
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
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Manage alert rules and active alerts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Alert Rule
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Alerts ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="rules">
            Alert Rules ({rules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No active alerts
            </div>
          ) : (
            <div className="grid gap-4">
              {activeAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No alert rules configured
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map((rule) => (
                <AlertRuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={(id) => console.log('Edit rule:', id)}
                  onDelete={(id) => console.log('Delete rule:', id)}
                  onToggle={handleToggleRule}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
