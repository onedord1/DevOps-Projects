'use client'

import { useState, useEffect } from 'react'
import { X, FolderKanban, Edit2, Trash2, Activity, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Endpoint, ProjectWithStats, ProjectPriority, ProjectStatus } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ProjectDashboard } from './project-dashboard'

interface ProjectDetailDialogProps {
  project: ProjectWithStats
  open: boolean
  onClose: () => void
  onProjectUpdated: () => void
  onProjectDeleted: () => void
}

export function ProjectDetailDialog({
  project,
  open,
  onClose,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'details'>('dashboard')
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    color: project.color,
    priority: project.priority,
    status: project.status,
    tags: project.tags?.join(', ') || '',
    owner_email: project.owner_email || '',
  })
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadEndpoints()
    }
  }, [open, project.id])

  const loadEndpoints = async () => {
    try {
      const response = await apiClient.getEndpoints({
        page: 1,
        per_page: 100,
      })
      if (response.success && response.data) {
        const projectEndpoints = response.data.items.filter(
          (endpoint) => endpoint.project_id === project.id
        )
        setEndpoints(projectEndpoints)
      }
    } catch (error) {
      console.error('Failed to load endpoints:', error)
    }
  }

  if (!open) return null

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      await apiClient.updateProject(project.id, {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        priority: formData.priority,
        status: formData.status,
        tags: tags.length > 0 ? tags : undefined,
        owner_email: formData.owner_email || undefined,
      })

      setIsEditing(false)
      onProjectUpdated()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will unlink ${endpoints.length} endpoint(s).`)) {
      return
    }

    setLoading(true)
    try {
      await apiClient.deleteProject(project.id)
      onProjectDeleted()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project')
    } finally {
      setLoading(false)
    }
  }

  const uptimePercentage =
    (project.total_endpoints || 0) > 0
      ? ((project.healthy_endpoints || 0) / (project.total_endpoints || 0)) * 100
      : 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {project.name}
                </h2>
                <p className="text-purple-100 font-medium">{project.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && activeTab === 'details' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    title="Edit Project"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={loading}
                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-0"
                    title="Delete Project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-violet-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'details'
                  ? 'bg-white text-violet-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {activeTab === 'dashboard' ? (
            <ProjectDashboard 
              projectId={project.id} 
              projectName={project.name}
              projectColor={project.color}
            />
          ) : isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as ProjectPriority })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ProjectStatus })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="production, critical (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_email">Owner Email</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              {/* Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Endpoints</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.total_endpoints || 0}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uptime</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {uptimePercentage.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Down</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {project.down_endpoints || 0}
                  </div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </h3>
                  <Badge>{project.priority}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </h3>
                  <Badge>{project.status.replace('_', ' ')}</Badge>
                </div>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {project.owner_email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Owner
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{project.owner_email}</p>
                </div>
              )}

              {/* Endpoints List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Endpoints ({endpoints.length})
                </h3>
                {endpoints.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {endpoints.map((endpoint) => (
                      <div
                        key={endpoint.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {endpoint.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {endpoint.url}
                          </div>
                        </div>
                        <Badge
                          className={
                            endpoint.status === 'UP'
                              ? 'bg-green-100 text-green-700'
                              : endpoint.status === 'DOWN'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {endpoint.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No endpoints assigned to this project yet.
                  </p>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</div>
                <div>Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
