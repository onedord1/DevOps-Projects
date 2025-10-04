import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { Plus } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import type { IncidentDTO } from '@/types';

export function Incidents() {
  const [incidents, setIncidents] = useState<IncidentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<IncidentDTO[]>(API_ENDPOINTS.INCIDENTS.BASE);
      setIncidents(data);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncidentClick = (incidentId: string) => {
    console.log('View incident:', incidentId);
  };

  const openIncidents = incidents.filter(i => i.status === 'open');
  const acknowledgedIncidents = incidents.filter(i => i.status === 'acknowledged');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Incidents</h1>
            <p className="text-muted-foreground">Track and manage incidents</p>
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
          <h1 className="text-3xl font-bold">Incidents</h1>
          <p className="text-muted-foreground">Track and manage incidents</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Incident
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Open ({openIncidents.length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({acknowledgedIncidents.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedIncidents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openIncidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No open incidents
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {openIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={handleIncidentClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4">
          {acknowledgedIncidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No acknowledged incidents
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {acknowledgedIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={handleIncidentClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedIncidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No resolved incidents
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {resolvedIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={handleIncidentClick}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
