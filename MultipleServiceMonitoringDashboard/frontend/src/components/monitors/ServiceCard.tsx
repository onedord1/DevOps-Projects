import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ServiceStatus, MonitorDTO } from '@/types';
import { Activity, Clock, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ServiceCardProps {
  monitor: MonitorDTO;
  onClick?: (id: string) => void;
}

const statusConfig: Record<ServiceStatus, { color: string; label: string; dotColor: string }> = {
  healthy: { color: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20', label: 'Healthy', dotColor: 'bg-status-healthy' },
  degraded: { color: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20', label: 'Degraded', dotColor: 'bg-status-degraded' },
  unhealthy: { color: 'bg-status-error/10 text-status-error border-status-error/20', label: 'Unhealthy', dotColor: 'bg-status-error' },
  unknown: { color: 'bg-status-unknown/10 text-status-unknown border-status-unknown/20', label: 'Unknown', dotColor: 'bg-status-unknown' },
};

export function ServiceCard({ monitor, onClick }: ServiceCardProps) {
  const config = statusConfig[monitor.status];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
        'border-l-4',
        monitor.status === 'healthy' && 'border-l-status-healthy',
        monitor.status === 'degraded' && 'border-l-status-degraded',
        monitor.status === 'unhealthy' && 'border-l-status-error',
        monitor.status === 'unknown' && 'border-l-status-unknown'
      )}
      onClick={() => onClick?.(monitor.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{monitor.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{monitor.endpoint}</p>
          </div>
          <Badge variant="outline" className={cn('shrink-0', config.color)}>
            <Circle className={cn('h-2 w-2 mr-1.5 fill-current', config.dotColor)} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Response Time</span>
          </div>
          <span className="font-medium">
            {monitor.responseTimeMs !== null ? `${monitor.responseTimeMs}ms` : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last Checked</span>
          </div>
          <span className="font-medium">
            {formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2">
          <Badge variant="secondary" className="text-xs">
            {monitor.protocol.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {monitor.environment}
          </Badge>
          {monitor.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
