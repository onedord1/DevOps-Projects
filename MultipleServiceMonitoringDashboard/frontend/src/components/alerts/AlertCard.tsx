import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AlertDTO } from '@/types';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: AlertDTO;
  onAcknowledge: (alertId: string) => void;
}

const severityColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warning: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20',
  critical: 'bg-status-error/10 text-status-error border-status-error/20',
};

export function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  return (
    <Card
      className={cn(
        'border-l-4',
        alert.severity === 'info' && 'border-l-blue-500',
        alert.severity === 'warning' && 'border-l-status-degraded',
        alert.severity === 'critical' && 'border-l-status-error'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold truncate">{alert.ruleName}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
          </div>
          <Badge variant="outline" className={cn('shrink-0', severityColors[alert.severity])}>
            {alert.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Monitor: </span>
            <span className="font-medium">{alert.monitorName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Value: </span>
            <span className="font-medium">{alert.value}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Threshold: </span>
            <span className="font-medium">{alert.threshold}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Triggered: </span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {alert.acknowledgedAt ? (
          <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>
              Acknowledged by {alert.acknowledgedBy} {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-end pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
