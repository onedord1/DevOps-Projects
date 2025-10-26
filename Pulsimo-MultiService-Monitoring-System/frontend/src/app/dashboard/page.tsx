'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import { useWebSocket } from '@/lib/websocket-context'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { ServiceCard } from '@/components/dashboard/service-card'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { AddEndpointDialog } from '@/components/dashboard/add-endpoint-dialog'
import { IncidentWidget } from '@/components/dashboard/incident-widget'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, FolderKanban, ArrowRight } from 'lucide-react'
import type { Endpoint, EndpointStatus, ServiceType, ProjectWithStats } from '@/types'
import Link from 'next/link'

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { subscribe } = useWebSocket()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filters, setFilters] = useState<{
    status?: EndpointStatus
    serviceType?: ServiceType
    tags?: string[]
    search?: string
  }>({})

  // Fetch projects
  const {
    data: projectsData,
    isLoading: projectsLoading,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.getProjects({ page: 1, per_page: 10 })
      return response
    },
    enabled: isAuthenticated,
  })

  const {
    data: endpointsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['endpoints', filters],
    queryFn: async () => {
      const response = await apiClient.getEndpoints({
        page: 1,
        per_page: 100,
        status: filters.status,
        service_type: filters.serviceType,
      })
      return response
    },
    enabled: isAuthenticated,
  })

  // Subscribe to WebSocket updates
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      // Refetch data on relevant events
      if (
        event.type === 'endpoint_status_changed' ||
        event.type === 'endpoint_check_completed'
      ) {
        refetch()
      }
    })

    return unsubscribe
  }, [subscribe, refetch])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  const endpoints = endpointsData?.data?.items || []

  // Apply client-side filtering
  const filteredEndpoints = endpoints.filter((endpoint) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        endpoint.name.toLowerCase().includes(searchLower) ||
        endpoint.url.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    if (filters.tags && filters.tags.length > 0) {
      const endpointTags = endpoint.tags || []
      const hasTag = filters.tags.some((tag) => endpointTags.includes(tag))
      if (!hasTag) return false
    }
    return true
  })

  // Calculate stats
  const stats = {
    total: filteredEndpoints.length,
    up: filteredEndpoints.filter((e) => e.status === 'UP').length,
    down: filteredEndpoints.filter((e) => e.status === 'DOWN').length,
    partialOutage: filteredEndpoints.filter((e) => e.status === 'PARTIAL_OUTAGE').length,
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Dashboard</h1>
            <p className="text-muted-foreground">Monitor all your services in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        <StatsOverview stats={stats} />

        {/* Incident Widget */}
        <IncidentWidget />

        {/* Projects Section */}
        {!projectsLoading && projectsData?.data?.items && projectsData.data.items.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Projects</h2>
              </div>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projectsData.data.items.slice(0, 4).map((project: ProjectWithStats) => (
                <Link key={project.id} href="/dashboard/projects">
                  <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color || '#3B82F6' }}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {project.total_endpoints || 0} endpoints
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">
                        {project.healthy_endpoints || 0} up
                      </span>
                      {(project.down_endpoints || 0) > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {project.down_endpoints} down
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-semibold">Failed to load endpoints</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredEndpoints.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">No services found</p>
            <Button onClick={() => setShowAddDialog(true)} className="mt-4">
              Add Your First Service
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEndpoints.map((endpoint) => (
              <ServiceCard key={endpoint.id} endpoint={endpoint} onUpdate={() => refetch()} />
            ))}
          </div>
        )}

        <AddEndpointDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => refetch()} />
    </div>
  )
}
