import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { AlertRuleDTO } from '@/types';
import { Bell, CreditCard as Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertRuleCardProps {
  rule: AlertRuleDTO;
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, enabled: boolean) => void;
}

const severityColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warning: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20',
  critical: 'bg-status-error/10 text-status-error border-status-error/20',
};

export function AlertRuleCard({ rule, onEdit, onDelete, onToggle }: AlertRuleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg truncate">{rule.name}</h3>
            </div>
            {rule.description && (
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn(severityColors[rule.severity])}>
              {rule.severity}
            </Badge>
            <Switch
              checked={rule.enabled}
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Condition: </span>
          <span className="font-medium">
            {rule.condition.metric} {rule.condition.operator} {rule.condition.threshold}
          </span>
          <span className="text-muted-foreground"> for {rule.condition.duration}s</span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Monitors: </span>
          <span className="font-medium">{rule.monitorIds.length} configured</span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Cooldown: </span>
          <span className="font-medium">{rule.cooldown}s</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(rule.id)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
