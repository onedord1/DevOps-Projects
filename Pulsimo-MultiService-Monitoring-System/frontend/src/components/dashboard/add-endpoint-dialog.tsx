'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { X, Activity, Info, Lock, Shield } from 'lucide-react'
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
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    service_type: 'backend' as ServiceType,
    description: '',
    tags: '',
    check_interval_seconds: 60,
    timeout_seconds: 10,
    failure_threshold_minutes: 3,
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
      
      if (response.success) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          name: '',
          url: '',
          service_type: 'backend',
          description: '',
          tags: '',
          check_interval_seconds: 60,
          timeout_seconds: 10,
          failure_threshold_minutes: 3,
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
              <label htmlFor="failure_threshold" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Failure Threshold (min)
              </label>
              <input
                id="failure_threshold"
                type="number"
                min="1"
                max="10"
                value={formData.failure_threshold_minutes}
                onChange={(e) => setFormData({ ...formData, failure_threshold_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Conditional Auth Header Field for HTTP services */}
          {requiresAuthHeader && (
            <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <label htmlFor="auth_header" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Authorization Header
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

          {/* Conditional Database Credentials */}
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
