export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export type MonitorProtocol = 'http' | 'https' | 'tcp' | 'grpc' | 'ping';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

export type NotificationChannelType = 'slack' | 'email' | 'pagerduty' | 'webhook';

export interface MonitorDTO {
  id: string;
  name: string;
  environment: string;
  protocol: MonitorProtocol;
  endpoint: string;
  interval: number;
  timeout: number;
  tags?: string[];
  status: ServiceStatus;
  responseTimeMs: number | null;
  lastCheckedAt: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  alertRuleIds?: string[];
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface MetricSeries {
  monitorId: string;
  metricName: string;
  points: MetricDataPoint[];
}

export interface AlertRuleDTO {
  id: string;
  name: string;
  description?: string;
  monitorIds: string[];
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
  };
  severity: AlertSeverity;
  cooldown: number;
  enabled: boolean;
  notificationChannelIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AlertDTO {
  id: string;
  ruleId: string;
  ruleName: string;
  monitorId: string;
  monitorName: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface IncidentDTO {
  id: string;
  title: string;
  description?: string;
  status: IncidentStatus;
  severity: AlertSeverity;
  affectedServices: string[];
  alertIds: string[];
  assignedTo?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  duration?: number;
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  type: 'created' | 'acknowledged' | 'comment' | 'status_change' | 'resolved';
  message: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export interface NotificationChannelDTO {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DependencyNode {
  id: string;
  monitorId: string;
  name: string;
  status: ServiceStatus;
  environment: string;
  metadata?: Record<string, any>;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'depends_on' | 'calls';
}

export interface DashboardSummary {
  totalServices: number;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  unknownCount: number;
  activeAlerts: number;
  openIncidents: number;
  avgResponseTime: number;
  recentAlerts: AlertDTO[];
  recentIncidents: IncidentDTO[];
}

export interface WebSocketEvent {
  type: 'monitor_status' | 'alert_triggered' | 'incident_updated' | 'metric_update' | 'connection_error';
  payload: any;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
