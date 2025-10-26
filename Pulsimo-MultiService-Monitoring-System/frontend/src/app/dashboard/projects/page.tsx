'use client'

import { useEffect, useState } from 'react'
import { Plus, FolderKanban, Search, Filter } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { ProjectWithStats } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProjectCard } from '@/components/dashboard/project-card'
import { AddProjectDialog } from '@/components/dashboard/add-project-dialog'
import { ProjectDetailDialog } from '@/components/dashboard/project-detail-dialog'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    loadProjects()
  }, [statusFilter, priorityFilter])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const params: any = { page: 1, per_page: 100 }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter
      }

      const response = await apiClient.getProjects(params)
      if (response.success && response.data) {
        setProjects(response.data.items)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setShowAddDialog(false)
    loadProjects()
  }

  const handleProjectUpdated = () => {
    setSelectedProject(null)
    loadProjects()
  }

  const handleProjectDeleted = () => {
    setSelectedProject(null)
    loadProjects()
  }

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Calculate summary statistics
  const totalEndpoints = projects.reduce((sum, p) => sum + (p.total_endpoints || 0), 0)
  const healthyEndpoints = projects.reduce((sum, p) => sum + (p.healthy_endpoints || 0), 0)
  const downEndpoints = projects.reduce((sum, p) => sum + (p.down_endpoints || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organize and monitor your service endpoints by projects
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Projects</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {projects.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Endpoints</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalEndpoints}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Healthy</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {healthyEndpoints}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Down</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {downEndpoints}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="on_hold">On Hold</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'Try adjusting your search filters'
              : 'Create your first project to organize your service endpoints'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onProjectCreated={handleProjectCreated}
      />

      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
          onProjectDeleted={handleProjectDeleted}
        />
      )}
    </div>
  )
}
