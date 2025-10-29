'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { X, Activity, Info, Lock, Shield, AlertTriangle, Bell, Clock, ChevronRight, Zap } from 'lucide-react'
import type { ServiceType, Project } from '@/types'

interface AddEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddEndpointDialog({ open, onOpenChange, onSuccess }: AddEndpointDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    service_type: 'backend' as ServiceType,
    description: '',
    tags: '',
    check_interval_seconds: 30,
    timeout_seconds: 10,
    // Alert Policy (count-based, not time-based)
    severity: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    consecutive_failures_threshold: 3,
    send_warning_on_first_failure: false,
    escalation_enabled: false,
    escalation_delay_seconds: 900,
    response_time_threshold_ms: null as number | null,
    auth_header: '',
    username: '',
    password: '',
    database_name: '',
    database_type: 'postgresql', // postgresql or mysql
    project_id: '',
  })

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open])

  const loadProjects = async () => {
    try {
      const response = await apiClient.getProjects({ page: 1, per_page: 100 })
      if (response.success && response.data) {
        setProjects(response.data.items)
        // Set default project to "Uncategorized Endpoints" if available and no project is selected
        if (!formData.project_id && response.data.items.length > 0) {
          const defaultProject = response.data.items.find(
            (p) => p.slug === 'uncategorized-endpoints'
          )
          if (defaultProject) {
            setFormData((prev) => ({ ...prev, project_id: defaultProject.id }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  // Check if the service type requires HTTP authentication header
  const requiresAuthHeader = ['backend', 'api', 'microservice'].includes(formData.service_type)
  
  // Check if the service type requires database credentials
  const requiresDbCredentials = formData.service_type === 'database'
  
  // Detect database type from URL
  const detectDatabaseType = (url: string): 'postgresql' | 'mysql' => {
    if (url.includes('mysql') || url.includes('mariadb') || url.includes('3306')) {
      return 'mysql'
    }
    return 'postgresql'
  }
  
  // Auto-detect database type when URL changes
  const handleUrlChange = (url: string) => {
    setFormData((prev: any) => ({
      ...prev,
      url,
      database_type: formData.service_type === 'database' ? detectDatabaseType(url) : prev.database_type
    }))
  }
  
  // Get URL placeholder based on service type
  const getUrlPlaceholder = () => {
    switch (formData.service_type) {
      case 'database':
        return 'postgresql://localhost:5432 or mysql://localhost:3306'
      case 'websocket':
        return 'ws://example.com/ws or wss://example.com/ws'
      case 'grpc':
        return 'grpc://example.com:50051'
      default:
        return 'https://api.example.com/health'
    }
  }

  // Apply severity preset configuration
  const applySeverityPreset = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    const presets = {
      critical: {
        check_interval_seconds: 10,
        consecutive_failures_threshold: 1,
        send_warning_on_first_failure: true,
        escalation_enabled: true,
        escalation_delay_seconds: 300,
        response_time_threshold_ms: 2000,
      },
      high: {
        check_interval_seconds: 10,
        consecutive_failures_threshold: 2,
        send_warning_on_first_failure: true,
        escalation_enabled: true,
        escalation_delay_seconds: 900,
        response_time_threshold_ms: 5000,
      },
      medium: {
        check_interval_seconds: 30,
        consecutive_failures_threshold: 3,
        send_warning_on_first_failure: false,
        escalation_enabled: false,
        escalation_delay_seconds: 900,
        response_time_threshold_ms: 10000,
      },
      low: {
        check_interval_seconds: 60,
        consecutive_failures_threshold: 5,
        send_warning_on_first_failure: false,
        escalation_enabled: false,
        escalation_delay_seconds: 1800,
        response_time_threshold_ms: null,
      },
    }
    
    setFormData({
      ...formData,
      severity,
      ...presets[severity]
    })
  }

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Find the default project if no project is selected
      let finalProjectId = formData.project_id
      if (!finalProjectId) {
        const defaultProject = projects.find((p) => p.slug === 'uncategorized-endpoints')
        if (defaultProject) {
          finalProjectId = defaultProject.id
        }
      }

      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        auth_header: formData.auth_header || undefined,
        project_id: finalProjectId || undefined,
      }

      const response = await apiClient.createEndpoint(payload)
      
      if (response.success && response.data) {
        const endpointId = response.data.id

        // Save alert policy
        try {
          await apiClient.createOrUpdateAlertPolicy(endpointId, {
            severity: formData.severity,
            consecutive_failures_threshold: formData.consecutive_failures_threshold,
            send_warning_on_first_failure: formData.send_warning_on_first_failure,
            warning_channels: ['slack'],
            send_alert_on_threshold: true,
            alert_channels: ['slack', 'email'],
            escalation_enabled: formData.escalation_enabled,
            escalation_delay_seconds: formData.escalation_delay_seconds,
            escalation_channels: ['email'],
            escalation_recipients: [],
            response_time_threshold_ms: formData.response_time_threshold_ms,
            response_time_window: 5,
            quiet_hours_enabled: false,
            quiet_hours_schedule: [],
            throttle_enabled: false,
            throttle_max_alerts: 3,
            throttle_time_window_seconds: 3600,
          })
        } catch (alertErr) {
          console.error('Failed to save alert policy:', alertErr)
          // Don't fail the whole operation if alert policy fails
        }

        onSuccess()
        onOpenChange(false)
        setFormData({
          name: '',
          url: '',
          service_type: 'backend',
          description: '',
          tags: '',
          check_interval_seconds: 30,
          timeout_seconds: 10,
          severity: 'medium',
          consecutive_failures_threshold: 3,
          send_warning_on_first_failure: false,
          escalation_enabled: false,
          escalation_delay_seconds: 900,
          response_time_threshold_ms: null,
          auth_header: '',
          username: '',
          password: '',
          database_name: '',
          database_type: 'postgresql',
          project_id: '',
        })
      } else {
        setError(response.error || 'Failed to create endpoint')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create endpoint')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Modern Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Add Service Endpoint</h2>
                <p className="text-blue-100 text-sm">Monitor your service health in real-time</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Row 1: Service Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Service Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              placeholder="My API Service"
            />
          </div>

          {/* Row 2: Service Type */}
          <div className="space-y-2">
            <label htmlFor="service_type" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Service Type *
            </label>
            <select
              id="service_type"
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
            >
              <option value="frontend">Frontend (Public)</option>
              <option value="backend">Backend (HTTP)</option>
              <option value="microservice">Microservice (HTTP)</option>
              <option value="api">API (HTTP)</option>
              <option value="database">Database (PostgreSQL/MySQL)</option>
              <option value="websocket">WebSocket (ws://)</option>
              <option value="grpc">gRPC (grpc://)</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Row 3: URL */}
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Endpoint URL *
            </label>
            <input
              id="url"
              type="url"
              required
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              placeholder={getUrlPlaceholder()}
            />
          </div>

          {/* Database Credentials - Moved here to appear right after URL */}
          {requiresDbCredentials && (
            <div className="space-y-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Database Credentials
                  </h3>
                </div>
                <select
                  value={formData.database_type}
                  onChange={(e) => setFormData({ ...formData, database_type: e.target.value })}
                  className="px-3 py-1.5 text-xs border-2 border-purple-200 dark:border-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL/MariaDB</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Username *
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                    placeholder={formData.database_type === 'postgresql' ? 'postgres' : 'root'}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                    placeholder={formData.database_type === 'postgresql' ? 'Required for connection' : 'Required for connection'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="database_name" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Database Name
                </label>
                <input
                  id="database_name"
                  type="text"
                  value={formData.database_name}
                  onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                  placeholder={formData.database_type === 'postgresql' ? 'monitoring_system' : 'mydb'}
                />
              </div>
              
              <div className="flex items-start gap-2 mt-2">
                <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {formData.database_type === 'postgresql' ? (
                    <>
                      <strong>PostgreSQL:</strong> Creates actual database connection and executes <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">SELECT 1</code> query.<br />
                      Both <strong>username and password are required</strong> for authentication.
                    </>
                  ) : (
                    <>
                      <strong>MySQL/MariaDB:</strong> Creates actual database connection and executes <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">SELECT 1</code> query.<br />
                      Both <strong>username and password are required</strong> for authentication.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Authorization Header (for HTTP services) */}
          {requiresAuthHeader && (
            <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <label htmlFor="auth_header" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Authorization Header (Optional)
                </label>
              </div>
              <input
                id="auth_header"
                type="text"
                value={formData.auth_header}
                onChange={(e) => setFormData({ ...formData, auth_header: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                placeholder="Bearer your-token-here or ApiKey your-key"
              />
              <div className="flex items-start gap-2 mt-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Examples:</strong> &quot;Bearer eyJhbGc...&quot;, &quot;ApiKey abc123...&quot;, &quot;Basic base64encoded...&quot;<br />
                  This header will be sent with each health check request.
                </p>
              </div>
            </div>
          )}

          {/* Row 4: Project (optional) */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="project_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Project (Optional)
              </label>
              <select
                id="project_id"
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              >
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row 5: Monitoring Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="check_interval" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Check Interval (seconds)
              </label>
              <input
                id="check_interval"
                type="number"
                min="10"
                max="3600"
                value={formData.check_interval_seconds}
                onChange={(e) => setFormData({ ...formData, check_interval_seconds: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="timeout" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Timeout (seconds)
              </label>
              <input
                id="timeout"
                type="number"
                min="1"
                max="120"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="consecutive_failures" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alert After (failures)
              </label>
              <input
                id="consecutive_failures"
                type="number"
                min="1"
                max="10"
                value={formData.consecutive_failures_threshold}
                onChange={(e) => setFormData({ ...formData, consecutive_failures_threshold: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alert after this many consecutive failures
              </p>
            </div>
          </div>

          {/* Alert Policy Configuration */}
          <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alert Policy</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Configure smart alerting based on service criticality</p>
              </div>
            </div>
            
            {/* Severity Selector */}
            <div className="space-y-2 mb-4">
              <label htmlFor="severity" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Service Criticality
              </label>
              <select
                id="severity"
                value={formData.severity}
                onChange={(e) => applySeverityPreset(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all font-semibold"
              >
                <option value="critical">🔴 Critical - Payment/Transaction Services</option>
                <option value="high">🟡 High - Customer-Facing Services</option>
                <option value="medium">🟢 Medium - Internal Services (Default)</option>
                <option value="low">⚪ Low - Non-Critical Services</option>
              </select>
            </div>
            
            {/* Smart Alerting Preview */}
            <div className="p-5 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-violet-200 dark:border-violet-800 shadow-inner">
              <div className="flex items-start gap-3 mb-3">
                <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-violet-900 dark:text-violet-100 mb-2">Smart Alerting Configured:</h4>
                  <ul className="space-y-2 text-sm text-violet-800 dark:text-violet-200">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-violet-500" />
                      <span>Check every <strong>{formData.check_interval_seconds}s</strong></span>
                    </li>
                    {formData.send_warning_on_first_failure && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                        <span>Send <strong>WARNING</strong> after 1st failure ({formData.check_interval_seconds}s delay)</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400">🚨</span>
                      <span>Send <strong>ALERT</strong> after <strong>{formData.consecutive_failures_threshold}</strong> failure{formData.consecutive_failures_threshold > 1 ? 's' : ''} ({formData.check_interval_seconds * formData.consecutive_failures_threshold}s delay)</span>
                    </li>
                    {formData.escalation_enabled && (
                      <li className="flex items-center gap-2">
                        <span className="text-orange-600 dark:text-orange-400">📧</span>
                        <span>Escalate after <strong>{formData.escalation_delay_seconds / 60}min</strong> if not acknowledged</span>
                      </li>
                    )}
                    {formData.response_time_threshold_ms && (
                      <li className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">⏱️</span>
                        <span>Also alert if response time &gt; <strong>{formData.response_time_threshold_ms}ms</strong></span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              Advanced Settings
            </button>
            
            {/* Advanced Settings Panel */}
            {showAdvanced && (
              <div className="mt-4 space-y-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <div className="space-y-3">
                  {/* Smart Alerting Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.send_warning_on_first_failure}
                      onChange={(e) => setFormData({
                        ...formData,
                        send_warning_on_first_failure: e.target.checked
                      })}
                      className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        Send WARNING on first failure
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sends a light notification immediately, full alert only after threshold
                      </p>
                    </div>
                  </label>
                  
                  {/* Escalation Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.escalation_enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        escalation_enabled: e.target.checked
                      })}
                      className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        Enable escalation
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Escalate to additional channels if not acknowledged
                      </p>
                    </div>
                  </label>
                  
                  {/* Escalation Delay */}
                  {formData.escalation_enabled && (
                    <div className="ml-8 space-y-2">
                      <label htmlFor="escalation_delay" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Escalate after (minutes)
                      </label>
                      <input
                        id="escalation_delay"
                        type="number"
                        min="5"
                        max="120"
                        value={formData.escalation_delay_seconds / 60}
                        onChange={(e) => setFormData({
                          ...formData,
                          escalation_delay_seconds: parseInt(e.target.value) * 60
                        })}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              placeholder="production, critical, us-east"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-6"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Create Endpoint
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
