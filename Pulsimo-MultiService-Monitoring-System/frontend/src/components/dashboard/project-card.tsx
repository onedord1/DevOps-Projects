'use client'

import { ProjectWithStats } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertCircle, CheckCircle2, Clock, FolderKanban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: ProjectWithStats
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const totalEndpoints = project.total_endpoints || 0
  const healthyEndpoints = project.healthy_endpoints || 0
  const downEndpoints = project.down_endpoints || 0
  const degradedEndpoints = project.degraded_endpoints || 0

  const uptimePercentage = totalEndpoints > 0 
    ? (healthyEndpoints / totalEndpoints) * 100 
    : 100

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusBadgeColor = () => {
    switch (project.status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'archived':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getBorderColor = () => {
    if (downEndpoints > 0) return 'border-l-red-500'
    if (degradedEndpoints > 0) return 'border-l-yellow-500'
    if (totalEndpoints === 0) return 'border-l-gray-300 dark:border-l-gray-600'
    return 'border-l-green-500'
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border-l-4 border-t border-r border-b
        ${getBorderColor()}
        border-t-gray-200 border-r-gray-200 border-b-gray-200
        dark:border-t-gray-700 dark:border-r-gray-700 dark:border-b-gray-700
        p-5 hover:shadow-lg transition-all cursor-pointer
        hover:scale-[1.02] duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${project.color}20` }}
          >
            <FolderKanban
              className="h-5 w-5"
              style={{ color: project.color }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {project.slug}
            </p>
          </div>
        </div>
        <Badge className={getPriorityColor(project.priority)}>
          {project.priority}
        </Badge>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Endpoints</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {totalEndpoints}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Uptime</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {uptimePercentage.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {totalEndpoints > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Service Status</span>
            <span>{healthyEndpoints}/{totalEndpoints} healthy</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {healthyEndpoints > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(healthyEndpoints / totalEndpoints) * 100}%` }}
              />
            )}
            {degradedEndpoints > 0 && (
              <div
                className="bg-yellow-500"
                style={{ width: `${(degradedEndpoints / totalEndpoints) * 100}%` }}
              />
            )}
            {downEndpoints > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(downEndpoints / totalEndpoints) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeColor()}>
            {project.status.replace('_', ' ')}
          </Badge>
          {project.tags && project.tags.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {project.tags.length} tag{project.tags.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {project.last_check_at && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(project.last_check_at), { addSuffix: true })}
          </div>
        )}
      </div>
    </div>
  )
}
