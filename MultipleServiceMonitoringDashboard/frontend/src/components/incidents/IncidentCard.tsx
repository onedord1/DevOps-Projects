import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IncidentDTO } from '@/types';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IncidentCardProps {
  incident: IncidentDTO;
  onClick?: (incidentId: string) => void;
}

const statusColors = {
  open: 'bg-status-error/10 text-status-error border-status-error/20',
  acknowledged: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20',
  resolved: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20',
};

const severityColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warning: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20',
  critical: 'bg-status-error/10 text-status-error border-status-error/20',
};

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        'border-l-4',
        incident.status === 'open' && 'border-l-status-error',
        incident.status === 'acknowledged' && 'border-l-status-degraded',
        incident.status === 'resolved' && 'border-l-status-healthy'
      )}
      onClick={() => onClick?.(incident.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {incident.status === 'resolved' ? (
                <CheckCircle className="h-4 w-4 text-status-healthy" />
              ) : (
                <AlertCircle className="h-4 w-4 text-status-error" />
              )}
              <h3 className="font-semibold text-lg truncate">{incident.title}</h3>
            </div>
            {incident.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {incident.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Badge variant="outline" className={cn(statusColors[incident.status])}>
              {incident.status}
            </Badge>
            <Badge variant="outline" className={cn(severityColors[incident.severity])}>
              {incident.severity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created</span>
          </div>
          <span className="font-medium">
            {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
          </span>
        </div>

        {incident.duration && (
          <div className="text-sm">
            <span className="text-muted-foreground">Duration: </span>
            <span className="font-medium">{Math.floor(incident.duration / 60)}m</span>
          </div>
        )}

        <div className="text-sm">
          <span className="text-muted-foreground">Affected Services: </span>
          <span className="font-medium">{incident.affectedServices.length}</span>
        </div>

        {incident.assignedTo && (
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned to: </span>
            <span className="font-medium">{incident.assignedTo}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-2">
          {incident.affectedServices.slice(0, 3).map((service) => (
            <Badge key={service} variant="secondary" className="text-xs">
              {service}
            </Badge>
          ))}
          {incident.affectedServices.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{incident.affectedServices.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
