import { useState } from 'react';
import { ServiceCard } from './ServiceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MonitorDTO, ServiceStatus } from '@/types';
import { Search, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ServiceGridProps {
  monitors: MonitorDTO[];
  onSelectMonitor?: (id: string) => void;
}

export function ServiceGrid({ monitors, onSelectMonitor }: ServiceGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<ServiceStatus>>(new Set());

  const filteredMonitors = monitors.filter((monitor) => {
    const matchesSearch =
      monitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitor.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitor.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilters.size === 0 || statusFilters.has(monitor.status);

    return matchesSearch && matchesStatus;
  });

  const toggleStatusFilter = (status: ServiceStatus) => {
    const newFilters = new Set(statusFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setStatusFilters(newFilters);
  };

  const statusCounts = monitors.reduce((acc, monitor) => {
    acc[monitor.status] = (acc[monitor.status] || 0) + 1;
    return acc;
  }, {} as Record<ServiceStatus, number>);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search monitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {statusFilters.size > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {statusFilters.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilters.has('healthy')}
              onCheckedChange={() => toggleStatusFilter('healthy')}
            >
              Healthy ({statusCounts.healthy || 0})
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.has('degraded')}
              onCheckedChange={() => toggleStatusFilter('degraded')}
            >
              Degraded ({statusCounts.degraded || 0})
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.has('unhealthy')}
              onCheckedChange={() => toggleStatusFilter('unhealthy')}
            >
              Unhealthy ({statusCounts.unhealthy || 0})
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.has('unknown')}
              onCheckedChange={() => toggleStatusFilter('unknown')}
            >
              Unknown ({statusCounts.unknown || 0})
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredMonitors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No monitors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMonitors.map((monitor) => (
            <ServiceCard
              key={monitor.id}
              monitor={monitor}
              onClick={onSelectMonitor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
