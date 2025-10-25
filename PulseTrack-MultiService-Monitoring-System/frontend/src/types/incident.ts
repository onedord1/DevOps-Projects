export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentState = 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed'

export interface Incident {
  id: string
  endpoint_id: string
  title: string
  description?: string
  severity: IncidentSeverity
  state: IncidentState
  assigned_to?: string
  
  created_at: string
  acknowledged_at?: string
  investigating_started_at?: string
  resolved_at?: string
  closed_at?: string
  
  resolution_notes?: string
  
  first_failure_at: string
  last_failure_at: string
  failure_count: number
  
  metadata: Record<string, any>
  created_by?: string
  updated_at: string
}

export interface IncidentWithEndpoint extends Incident {
  endpoint_name: string
  endpoint_url: string
  endpoint_service_type: string
}

export interface IncidentStateHistory {
  id: string
  incident_id: string
  from_state?: string
  to_state: string
  changed_by?: string
  notes?: string
  changed_at: string
}

export interface IncidentStats {
  total_incidents: number
  open_incidents: number
  acknowledged_incidents: number
  investigating_incidents: number
  resolved_today: number
  critical_incidents: number
  avg_resolution_time_minutes?: number
}

export interface CreateIncidentRequest {
  endpoint_id: string
  title: string
  description?: string
  severity: IncidentSeverity
  assigned_to?: string
  first_failure_at: string
  metadata?: Record<string, any>
}

export interface UpdateIncidentRequest {
  title?: string
  description?: string
  severity?: IncidentSeverity
  assigned_to?: string
  resolution_notes?: string
}

export interface ChangeIncidentStateRequest {
  state: IncidentState
  notes?: string
  changed_by?: string
}
