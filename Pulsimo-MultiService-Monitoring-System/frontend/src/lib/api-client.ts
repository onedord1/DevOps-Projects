import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  ApiResponse,
  Endpoint,
  LoginRequest,
  LoginResponse,
  NotificationChannel,
  Organization,
  PaginatedResponse,
  Project,
  ProjectWithStats,
  RegisterRequest,
  User,
  Incident,
  IncidentWithEndpoint,
  IncidentStats,
  IncidentStateHistory,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  ChangeIncidentStateRequest,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to attach auth token
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              try {
                const { data } = await axios.post<ApiResponse<{ access_token: string }>>(
                  `${API_URL}/api/v1/auth/refresh`,
                  { refresh_token: refreshToken }
                )
                if (data.data?.access_token) {
                  localStorage.setItem('access_token', data.data.access_token)
                  // Retry original request
                  if (error.config) {
                    error.config.headers.Authorization = `Bearer ${data.data.access_token}`
                    return axios.request(error.config)
                  }
                }
              } catch {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                window.location.href = '/login'
              }
            } else {
              window.location.href = '/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth
  async login(credentials: LoginRequest) {
    const { data } = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return data
  }

  async register(registrationData: RegisterRequest) {
    const { data } = await this.client.post<ApiResponse<any>>('/auth/register', registrationData)
    return data
  }

  // Organizations
  async getOrganizations() {
    const { data } = await this.client.get<ApiResponse<Organization[]>>('/organizations')
    return data
  }

  async getOrganization(id: string) {
    const { data } = await this.client.get<ApiResponse<Organization>>(`/organizations/${id}`)
    return data
  }

  async updateOrganization(id: string, updates: Partial<Organization>) {
    const { data } = await this.client.put<ApiResponse<Organization>>(`/organizations/${id}`, updates)
    return data
  }

  // Projects
  async getProjects(params?: {
    page?: number
    per_page?: number
    status?: string
    priority?: string
  }) {
    const { data } = await this.client.get<ApiResponse<PaginatedResponse<ProjectWithStats>>>('/projects', {
      params,
    })
    return data
  }

  async getProject(id: string) {
    const { data } = await this.client.get<ApiResponse<ProjectWithStats>>(`/projects/${id}`)
    return data
  }

  async createProject(project: Partial<Project>) {
    const { data } = await this.client.post<ApiResponse<Project>>('/projects', project)
    return data
  }

  async updateProject(id: string, updates: Partial<Project>) {
    const { data } = await this.client.put<ApiResponse<Project>>(`/projects/${id}`, updates)
    return data
  }

  async deleteProject(id: string) {
    const { data } = await this.client.delete<ApiResponse<void>>(`/projects/${id}`)
    return data
  }

  async getProjectDashboard(id: string) {
    const { data } = await this.client.get<ApiResponse<any>>(`/projects/${id}/dashboard`)
    return data
  }

  // Endpoints
  async getEndpoints(params?: {
    page?: number
    per_page?: number
    status?: string
    service_type?: string
  }) {
    const { data } = await this.client.get<ApiResponse<PaginatedResponse<Endpoint>>>('/endpoints', {
      params,
    })
    return data
  }

  async getEndpoint(id: string) {
    const { data } = await this.client.get<ApiResponse<Endpoint>>(`/endpoints/${id}`)
    return data
  }

  async createEndpoint(endpoint: Partial<Endpoint>) {
    const { data } = await this.client.post<ApiResponse<Endpoint>>('/endpoints', endpoint)
    return data
  }

  async updateEndpoint(id: string, updates: Partial<Endpoint>) {
    const { data } = await this.client.put<ApiResponse<Endpoint>>(`/endpoints/${id}`, updates)
    return data
  }

  async deleteEndpoint(id: string) {
    const { data } = await this.client.delete<ApiResponse<void>>(`/endpoints/${id}`)
    return data
  }

  // Health Checks
  async getEndpointHistory(endpointId: string, days?: number) {
    const { data } = await this.client.get<ApiResponse<any>>(`/endpoints/${endpointId}/history`, {
      params: { days },
    })
    return data
  }

  async getEndpointStats(endpointId: string) {
    const { data } = await this.client.get<ApiResponse<any>>(`/endpoints/${endpointId}/stats`)
    return data
  }

  // Notification Channels
  async getNotificationChannels() {
    const { data } = await this.client.get<ApiResponse<NotificationChannel[]>>('/notification-channels')
    return data
  }

  async createNotificationChannel(channel: Partial<NotificationChannel>) {
    const { data } = await this.client.post<ApiResponse<NotificationChannel>>(
      '/notification-channels',
      channel
    )
    return data
  }

  async updateNotificationChannel(id: string, channel: Partial<NotificationChannel>) {
    const { data } = await this.client.put<ApiResponse<NotificationChannel>>(
      `/notification-channels/${id}`,
      channel
    )
    return data
  }

  async deleteNotificationChannel(id: string) {
    const { data } = await this.client.delete<ApiResponse<void>>(`/notification-channels/${id}`)
    return data
  }

  async testNotificationChannel(channelId: string, testMessage?: string) {
    const { data } = await this.client.post<ApiResponse<void>>('/notification-channels/test', {
      channel_id: channelId,
      test_message: testMessage,
    })
    return data
  }

  // Notification Silences
  async createSilence(silenceData: {
    endpoint_id: string
    channel_id?: string | null
    reason?: string
    silence_type: 'temporary' | 'permanent'
    duration_minutes?: number
  }) {
    const { data } = await this.client.post<ApiResponse<any>>('/silences', silenceData)
    return data
  }

  async getSilences() {
    const { data } = await this.client.get<ApiResponse<any[]>>('/silences')
    return data
  }

  async unmuteEndpoint(endpointId: string, channelId?: string | null) {
    const { data } = await this.client.post<ApiResponse<void>>('/silences/unmute', {
      endpoint_id: endpointId,
      channel_id: channelId,
    })
    return data
  }

  async checkSilence(endpointId: string, channelId: string) {
    const { data } = await this.client.get<ApiResponse<any>>('/silences/check', {
      params: { endpoint_id: endpointId, channel_id: channelId },
    })
    return data
  }

  async getEndpointSilenceStatus(endpointId: string) {
    const { data } = await this.client.get<ApiResponse<any[]>>(`/silences/endpoint/${endpointId}`)
    return data
  }

  async getSilencePresets() {
    const { data } = await this.client.get<ApiResponse<any[]>>('/silences/presets')
    return data
  }

  // Analytics
  async getUptimeMetrics(endpointId: string, period: string = '30d') {
    const { data } = await this.client.get<ApiResponse<any>>(`/analytics/uptime/${endpointId}`, {
      params: { period }
    })
    return data
  }

  async getResponseTimeData(endpointId: string, period: string = '7d') {
    const { data } = await this.client.get<ApiResponse<any[]>>(`/analytics/response-times/${endpointId}`, {
      params: { period }
    })
    return data
  }

  async getDowntimePeriods(endpointId: string, period: string = '30d') {
    const { data } = await this.client.get<ApiResponse<any[]>>(`/analytics/downtime/${endpointId}`, {
      params: { period }
    })
    return data
  }

  async getTimeline(endpointId: string, period: string = '24h') {
    const { data } = await this.client.get<ApiResponse<any[]>>(`/analytics/timeline/${endpointId}`, {
      params: { period }
    })
    return data
  }

  // Users
  async getUsers() {
    const { data } = await this.client.get<ApiResponse<User[]>>('/users')
    return data
  }

  async createUser(user: Partial<User> & { password: string }) {
    const { data } = await this.client.post<ApiResponse<User>>('/users', user)
    return data
  }

  async updateUser(id: string, updates: Partial<User>) {
    const { data } = await this.client.put<ApiResponse<User>>(`/users/${id}`, updates)
    return data
  }

  async deleteUser(id: string) {
    const { data } = await this.client.delete<ApiResponse<void>>(`/users/${id}`)
    return data
  }

  // API Keys
  async getApiKeys() {
    const { data } = await this.client.get<ApiResponse<any[]>>('/api-keys')
    return data
  }

  async createApiKey(name: string) {
    const { data} = await this.client.post<ApiResponse<any>>('/api-keys', { name })
    return data
  }

  async deleteApiKey(id: string) {
    const { data } = await this.client.delete<ApiResponse<void>>(`/api-keys/${id}`)
    return data
  }

  // Incidents
  async getIncidents(params?: {
    page?: number
    per_page?: number
    state?: string
    severity?: string
    endpoint_id?: string
    assigned_to?: string
  }) {
    const { data } = await this.client.get<ApiResponse<PaginatedResponse<IncidentWithEndpoint>>>('/incidents', { params })
    return data
  }

  async getIncident(id: string) {
    const { data } = await this.client.get<ApiResponse<IncidentWithEndpoint>>(`/incidents/${id}`)
    return data
  }

  async createIncident(incident: CreateIncidentRequest) {
    const { data } = await this.client.post<ApiResponse<Incident>>('/incidents', incident)
    return data
  }

  async updateIncident(id: string, updates: UpdateIncidentRequest) {
    const { data } = await this.client.put<ApiResponse<Incident>>(`/incidents/${id}`, updates)
    return data
  }

  async changeIncidentState(id: string, request: ChangeIncidentStateRequest) {
    const { data } = await this.client.put<ApiResponse<Incident>>(`/incidents/${id}/state`, request)
    return data
  }

  async getIncidentHistory(id: string) {
    const { data } = await this.client.get<ApiResponse<IncidentStateHistory[]>>(`/incidents/${id}/history`)
    return data
  }

  async getIncidentStats() {
    const { data } = await this.client.get<ApiResponse<IncidentStats>>('/incidents/stats')
    return data
  }

  async deleteIncident(id: string) {
    const { data} = await this.client.delete<ApiResponse<void>>(`/incidents/${id}`)
    return data
  }

  // Alert Policies
  async createOrUpdateAlertPolicy(endpointId: string, policy: any) {
    const { data } = await this.client.post<ApiResponse<any>>(
      `/endpoints/${endpointId}/alert-policy`,
      policy
    )
    return data
  }

  async getAlertPolicy(endpointId: string) {
    const { data } = await this.client.get<ApiResponse<any>>(
      `/endpoints/${endpointId}/alert-policy`
    )
    return data
  }

  async deleteAlertPolicy(endpointId: string) {
    const { data } = await this.client.delete<ApiResponse<void>>(
      `/endpoints/${endpointId}/alert-policy`
    )
    return data
  }

  async getAlertPolicyPresets() {
    const { data } = await this.client.get<ApiResponse<any[]>>('/alert-policy-presets')
    return data
  }

  // Post-Mortem
  async generatePostMortem(incidentId: string) {
    const { data } = await this.client.get<ApiResponse<string>>(`/incidents/${incidentId}/post-mortem`)
    return data
  }

  // Acknowledge Incident
  async acknowledgeIncident(incidentId: string, assignedTo?: string) {
    const { data } = await this.client.post<ApiResponse<Incident>>(`/incidents/${incidentId}/acknowledge`, {
      assigned_to: assignedTo
    })
    return data
  }

  // Assign Incident
  async assignIncident(incidentId: string, assignedTo: string) {
    const { data} = await this.client.put<ApiResponse<Incident>>(`/incidents/${incidentId}`, {
      assigned_to: assignedTo
    })
    return data
  }
}

export const apiClient = new ApiClient()
