'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Activity, Lock, Info, AlertTriangle, Bell, Clock, ChevronRight, Zap, Shield } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Endpoint, ServiceType } from '@/types'

interface EditEndpointDialogProps {
  endpoint: Endpoint
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditEndpointDialog({ endpoint, open, onOpenChange, onSuccess }: EditEndpointDialogProps) {
  const [formData, setFormData] = useState({
    name: endpoint.name,
    url: endpoint.url,
    service_type: endpoint.service_type as ServiceType,
    description: endpoint.description || '',
    tags: endpoint.tags ? endpoint.tags.join(', ') : '',
    owner_contact: endpoint.owner_contact || '',
    check_interval_seconds: endpoint.check_interval_seconds || 30,
    timeout_seconds: endpoint.timeout_seconds || 10,
    expected_status_code: endpoint.expected_status_code || 200,
    // Alert Policy (count-based, not time-based)
    severity: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    consecutive_failures_threshold: 3,
    send_warning_on_first_failure: false,
    escalation_enabled: false,
    escalation_delay_seconds: 900,
    response_time_threshold_ms: null as number | null,
    retry_count: endpoint.retry_count || 2,
    retry_delay_seconds: endpoint.retry_delay_seconds || 5,
    auth_header: endpoint.auth_header || '',
    username: endpoint.username || '',
    password: endpoint.password || '',
    database_name: endpoint.database_name || '',
    database_type: endpoint.url?.includes('mysql') ? 'mysql' : 'postgresql',
    project_id: endpoint.project_id || '',
  })
  const [projects, setProjects] = useState<any[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.getProjects()
        if (response.success && response.data) {
          setProjects(response.data.items || [])
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      }
    }
    fetchProjects()
  }, [])

  // Update form when endpoint changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: endpoint.name,
        url: endpoint.url,
        service_type: endpoint.service_type as ServiceType,
        description: endpoint.description || '',
        tags: endpoint.tags ? endpoint.tags.join(', ') : '',
        owner_contact: endpoint.owner_contact || '',
        check_interval_seconds: endpoint.check_interval_seconds || 30,
        timeout_seconds: endpoint.timeout_seconds || 10,
        expected_status_code: endpoint.expected_status_code || 200,
        // Alert Policy fields (will be loaded from API later)
        severity: 'medium',
        consecutive_failures_threshold: 3,
        send_warning_on_first_failure: false,
        escalation_enabled: false,
        escalation_delay_seconds: 900,
        response_time_threshold_ms: null,
        retry_count: endpoint.retry_count || 2,
        retry_delay_seconds: endpoint.retry_delay_seconds || 5,
        auth_header: endpoint.auth_header || '',
        username: endpoint.username || '',
        password: endpoint.password || '',
        database_name: endpoint.database_name || '',
        database_type: endpoint.url?.includes('mysql') ? 'mysql' : 'postgresql',
        project_id: endpoint.project_id || '',
      })
      setError('')
    }
  }, [endpoint, open])

  // Auto-detect database type from URL
  const handleUrlChange = (newUrl: string) => {
    setFormData({ ...formData, url: newUrl })
    if (formData.service_type === 'database') {
      if (newUrl.includes('mysql')) {
        setFormData(prev => ({ ...prev, url: newUrl, database_type: 'mysql' }))
      } else if (newUrl.includes('postgres')) {
        setFormData(prev => ({ ...prev, url: newUrl, database_type: 'postgresql' }))
      }
    }
  }

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        auth_header: formData.auth_header || undefined,
        username: formData.username || undefined,
        password: formData.password || undefined,
        database_name: formData.database_name || undefined,
        project_id: formData.project_id || undefined,
      }

      const response = await apiClient.updateEndpoint(endpoint.id, payload)
      
      if (response.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        setError(response.error || 'Failed to update endpoint')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update endpoint')
    } finally {
      setIsLoading(false)
    }
  }

  const requiresAuthHeader = ['backend', 'api', 'microservice', 'other'].includes(formData.service_type)
  const requiresDatabaseCreds = formData.service_type === 'database'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Service Endpoint</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Service Name *
              </label>
              <input
                id="edit-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                placeholder="My API Service"
              />
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-service-type">
                Service Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit-service-type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="microservice">Microservice</option>
                <option value="database">Database</option>
                <option value="api">API</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 3: URL */}
          <div className="space-y-2">
            <label htmlFor="edit-url" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Endpoint URL *
            </label>
            <input
              id="edit-url"
              type="url"
              required
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              placeholder="https://api.example.com/health"
            />
          </div>

          {/* Row 4: Project (optional) */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="edit-project" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Project (Optional)
              </label>
              <select
                id="edit-project"
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              >
                <option value="">No Project</option>
                {projects.map((project: any) => (
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
              <label htmlFor="edit-check-interval" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Check Interval (seconds)
              </label>
              <input
                id="edit-check-interval"
                type="number"
                min="10"
                max="3600"
                value={formData.check_interval_seconds}
                onChange={(e) => setFormData({ ...formData, check_interval_seconds: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-timeout" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Timeout (seconds)
              </label>
              <input
                id="edit-timeout"
                type="number"
                min="1"
                max="120"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-consecutive-failures" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alert After (failures)
              </label>
              <input
                id="edit-consecutive-failures"
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


          {/* Conditional Auth Header for HTTP services */}
          {requiresAuthHeader && (
            <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <label htmlFor="edit-auth-header" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Authorization Header
                </label>
              </div>
              <input
                id="edit-auth-header"
                type="password"
                value={formData.auth_header}
                onChange={(e) => setFormData({ ...formData, auth_header: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                placeholder="Bearer token123 or Basic user:pass"
              />
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                For protected endpoints requiring authentication
              </p>
            </div>
          )}

          {/* Conditional Database Credentials */}
          {requiresDatabaseCreds && (
            <div className="space-y-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Database Credentials
                  </label>
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
                  <label htmlFor="edit-username" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Username *
                  </label>
                  <input
                    id="edit-username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                    placeholder={formData.database_type === 'postgresql' ? 'postgres' : 'root'}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="edit-password" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Password *
                  </label>
                  <input
                    id="edit-password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                    placeholder="Required for connection"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-database-name" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Database Name
                </label>
                <input
                  id="edit-database-name"
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

          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tags (comma-separated)
            </label>
            <input
              id="edit-tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              placeholder="production, critical, us-east"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Service'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
