'use client'

import { useState, useEffect } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  Search,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { IncidentWithEndpoint, IncidentStats, IncidentSeverity, IncidentState } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentWithEndpoint[]>([])
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<IncidentWithEndpoint | null>(null)
  
  // Filters
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchIncidents()
    fetchStats()
  }, [stateFilter, severityFilter, page])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const params: any = { page, per_page: 20 }
      
      if (stateFilter !== 'all') params.state = stateFilter
      if (severityFilter !== 'all') params.severity = severityFilter
      
      const response = await apiClient.getIncidents(params)
      if (response.success && response.data) {
        setIncidents(response.data.items)
        setTotalPages(response.data.total_pages)
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.getIncidentStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
      case 'low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
    }
  }

  const getStateColor = (state: IncidentState) => {
    switch (state) {
      case 'open': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'acknowledged': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'investigating': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'closed': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
    }
  }

  const getStateIcon = (state: IncidentState) => {
    switch (state) {
      case 'open': return <AlertCircle className="h-4 w-4" />
      case 'acknowledged': return <Clock className="h-4 w-4" />
      case 'investigating': return <Activity className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        incident.title.toLowerCase().includes(query) ||
        incident.endpoint_name.toLowerCase().includes(query) ||
        incident.description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Incident Management</h1>
        <p className="text-muted-foreground mt-1">Track and resolve service failures</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Incidents</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.open_incidents}</p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-red-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Critical</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.critical_incidents}</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-orange-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Investigating</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.investigating_incidents}</p>
                  </div>
                  <Activity className="h-12 w-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Resolved Today</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.resolved_today}</p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
                </div>
              </div>
            </div>
        )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 transition-all"
                />
              </div>

              <select
                value={stateFilter}
                onChange={(e) => { setStateFilter(e.target.value); setPage(1) }}
                className="px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 transition-all"
              >
                <option value="all">All States</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}
                className="px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 transition-all"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

          <button
            onClick={() => { setStateFilter('all'); setSeverityFilter('all'); setSearchQuery(''); setPage(1) }}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border-2 border-slate-200 dark:border-slate-700">
              <AlertCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-400">No incidents found</p>
              <p className="text-slate-500 dark:text-slate-500 mt-2">All services are running smoothly!</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStateColor(incident.state)}`}>
                        {getStateIcon(incident.state)}
                        {incident.state.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                      {incident.title}
                    </h3>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {incident.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        {incident.endpoint_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {incident.failure_count} failures
                      </span>
                      {incident.assigned_to && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {incident.assigned_to}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Next
            </button>
          </div>
        )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedIncident(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-200 dark:border-slate-700 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getSeverityColor(selectedIncident.severity)}`}>
                      {selectedIncident.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStateColor(selectedIncident.state)}`}>
                      {getStateIcon(selectedIncident.state)}
                      {selectedIncident.state.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedIncident.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Created {formatDistanceToNow(new Date(selectedIncident.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XCircle className="h-6 w-6 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedIncident.description && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Description</h3>
                  <p className="text-slate-700 dark:text-slate-300">{selectedIncident.description}</p>
                </div>
              )}

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Endpoint Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Affected Service
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Service Name</p>
                      <p className="text-blue-900 dark:text-blue-100 font-bold">{selectedIncident.endpoint_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">URL</p>
                      <p className="text-blue-900 dark:text-blue-100 text-sm font-mono break-all">{selectedIncident.endpoint_url}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Service Type</p>
                      <p className="text-blue-900 dark:text-blue-100 font-bold capitalize">{selectedIncident.endpoint_service_type}</p>
                    </div>
                  </div>
                </div>

                {/* Failure Stats */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border-2 border-red-200 dark:border-red-800">
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Failure Statistics
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">First Failure</p>
                      <p className="text-red-900 dark:text-red-100 font-bold">{new Date(selectedIncident.first_failure_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Last Failure</p>
                      <p className="text-red-900 dark:text-red-100 font-bold">{new Date(selectedIncident.last_failure_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Total Failures</p>
                      <p className="text-red-900 dark:text-red-100 font-bold text-2xl">{selectedIncident.failure_count}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Incident Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Created</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedIncident.acknowledged_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">Acknowledged</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(selectedIncident.acknowledged_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {selectedIncident.investigating_started_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">Investigation Started</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(selectedIncident.investigating_started_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {selectedIncident.resolved_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">Resolved</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(selectedIncident.resolved_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {selectedIncident.closed_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">Closed</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(selectedIncident.closed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment & Resolution */}
              {(selectedIncident.assigned_to || selectedIncident.resolution_notes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedIncident.assigned_to && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800">
                      <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2">Assigned To</h3>
                      <p className="text-purple-900 dark:text-purple-100 font-bold">{selectedIncident.assigned_to}</p>
                    </div>
                  )}

                  {selectedIncident.resolution_notes && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
                      <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Resolution Notes</h3>
                      <p className="text-green-900 dark:text-green-100">{selectedIncident.resolution_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t-2 border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Incident ID: <span className="font-mono font-bold">{selectedIncident.id}</span>
                </p>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
