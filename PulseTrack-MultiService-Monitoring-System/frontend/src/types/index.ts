export type ServiceType = 'frontend' | 'backend' | 'microservice' | 'database' | 'api' | 'websocket' | 'grpc' | 'other'

export type EndpointStatus = 'UP' | 'PARTIAL_OUTAGE' | 'DOWN' | 'UNKNOWN'

export type CheckStatus = 'success' | 'failure' | 'timeout'

export type FailureReason =
  | 'TIMEOUT'
  | 'DNS_ERROR'
  | 'CONNECTION_ERROR'
  | 'TLS_ERROR'
  | 'HTTP_ERROR'
  | 'UNEXPECTED_STATUS_CODE'
  | 'RESPONSE_TIME_EXCEEDED'
  | 'INVALID_RESPONSE'
  | 'NETWORK_ERROR'
  | 'OTHER'

export type NotificationChannelType = 'email' | 'slack' | 'discord' | 'msteams' | 'webhook'

export type UserRole = 'admin' | 'member' | 'viewer'

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'

export type ProjectStatus = 'active' | 'archived' | 'on_hold'

export interface Project {
  id: string
  org_id: string
  name: string
  slug: string
  description?: string
  color: string
  priority: ProjectPriority
  status: ProjectStatus
  tags?: string[]
  owner_email?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface ProjectWithStats extends Project {
  total_endpoints?: number
  healthy_endpoints?: number
  down_endpoints?: number
  degraded_endpoints?: number
  unknown_endpoints?: number
  last_check_at?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  contact_email: string
  created_at: string
  updated_at: string
  is_active: boolean
  timezone: string
  date_format: string
}

export interface Endpoint {
  id: string
  org_id: string
  project_id?: string
  name: string
  url: string
  service_type: ServiceType
  description?: string
  tags?: string[]
  owner_contact?: string
  check_interval_seconds: number
  timeout_seconds: number
  expected_status_code?: number
  expected_response_time_ms?: number
  failure_threshold_minutes: number
  retry_count: number
  retry_delay_seconds: number
  status: EndpointStatus
  last_check_at?: string
  last_status_change_at?: string
  created_at: string
  updated_at: string
  is_active: boolean
  auth_header?: string
  username?: string
  password?: string
  database_name?: string
  connection_params?: any
}

export interface HealthCheck {
  id: string
  endpoint_id: string
  check_status: CheckStatus
  response_time_ms?: number
  status_code?: number
  failure_reason?: FailureReason
  error_message?: string
  checked_at: string
}

export interface NotificationChannel {
  id: string
  org_id: string
  name: string
  channel_type: NotificationChannelType
  config: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  org_id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  last_login_at?: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  org_name: string
  org_slug: string
  org_contact_email: string
  admin_email: string
  admin_password: string
  admin_name: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    org_id: string
    email: string
    name: string
    role: UserRole
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface EndpointStats {
  endpoint_id: string
  current_downtime_seconds?: number
  uptime_percentage_30d?: number
  avg_response_time_ms?: number
}

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
}

// Re-export incident types
export * from './incident'
