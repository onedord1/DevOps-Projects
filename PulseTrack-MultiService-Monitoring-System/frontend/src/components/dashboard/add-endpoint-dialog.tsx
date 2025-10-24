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

  // Check if the service type requires authentication
  const requiresAuth = formData.service_type !== 'frontend'

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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Group this endpoint under a project for better organization
              </p>
            </div>
          )}

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

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Endpoint URL *
            </label>
            <input
              id="url"
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              placeholder="https://api.example.com/health"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="backend">Backend (Authenticated)</option>
                <option value="microservice">Microservice (Authenticated)</option>
                <option value="database">Database (Authenticated)</option>
                <option value="api">API (Authenticated)</option>
                <option value="other">Other</option>
              </select>
            </div>

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
          </div>

          {/* Conditional Auth Header Field */}
          {requiresAuth && (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Failure Threshold (minutes)
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
