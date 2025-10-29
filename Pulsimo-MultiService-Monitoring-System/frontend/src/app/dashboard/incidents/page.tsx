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
  Activity,
  UserPlus,
  CheckCheck,
  FileText,
  Download,
  Copy
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
  const [assigneeInput, setAssigneeInput] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [incidentToAssign, setIncidentToAssign] = useState<string | null>(null)
  const [postMortem, setPostMortem] = useState<string | null>(null)
  const [showPostMortem, setShowPostMortem] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'})

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({show: true, message, type})
    setTimeout(() => setToast({show: false, message: '', type: 'success'}), 3000)
  }

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

  const handleAcknowledge = async (incidentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      setActionLoading(incidentId)
      await apiClient.acknowledgeIncident(incidentId)
      await fetchIncidents()
      showToast('Incident acknowledged successfully!', 'success')
    } catch (error) {
      console.error('Failed to acknowledge:', error)
      showToast('Failed to acknowledge incident', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssign = async (incidentId: string) => {
    if (!assigneeInput.trim()) {
      showToast('Please enter an assignee name', 'error')
      return
    }
    try {
      setActionLoading(incidentId)
      await apiClient.assignIncident(incidentId, assigneeInput)
      await fetchIncidents()
      setShowAssignModal(false)
      setIncidentToAssign(null)
      setAssigneeInput('')
      showToast('Incident assigned successfully!', 'success')
    } catch (error) {
      console.error('Failed to assign:', error)
      showToast('Failed to assign incident', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGeneratePostMortem = async (incidentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      setActionLoading(incidentId)
      const response = await apiClient.generatePostMortem(incidentId)
      if (response.success && response.data) {
        setPostMortem(response.data)
        setShowPostMortem(true)
      }
    } catch (error) {
      console.error('Failed to generate post-mortem:', error)
      showToast('Failed to generate post-mortem', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const copyPostMortem = () => {
    if (postMortem) {
      navigator.clipboard.writeText(postMortem)
      showToast('Post-mortem copied to clipboard!', 'success')
    }
  }

  const downloadPostMortem = () => {
    if (postMortem) {
      const blob = new Blob([postMortem], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `post-mortem-${selectedIncident?.id}.md`
      a.click()
      URL.revokeObjectURL(url)
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
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

                  {/* Action Icons - Top Right Corner */}
                  <div className="flex items-center gap-2">
                    {incident.state === 'open' && (
                      <button
                        onClick={(e) => handleAcknowledge(incident.id, e)}
                        disabled={actionLoading === incident.id}
                        title="Acknowledge"
                        className="p-2.5 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300 rounded-lg transition-all hover:scale-110 disabled:opacity-50"
                      >
                        <CheckCheck className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setIncidentToAssign(incident.id); setShowAssignModal(true); }}
                      title="Assign to Team Member"
                      className="p-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg transition-all hover:scale-110"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                    {incident.state === 'resolved' && (
                      <button
                        onClick={(e) => handleGeneratePostMortem(incident.id, e)}
                        disabled={actionLoading === incident.id}
                        title="Generate Post-Mortem"
                        className="p-2.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-300 rounded-lg transition-all hover:scale-110 disabled:opacity-50"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                    )}
                  </div>
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

      {/* Assign Modal */}
      {showAssignModal && incidentToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border-2 border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Assign Incident</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Assign this incident to a team member</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Assignee Name or Email
              </label>
              <input
                type="text"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                placeholder="e.g. john@example.com or John Doe"
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700"
                onKeyPress={(e) => e.key === 'Enter' && handleAssign(incidentToAssign)}
              />
            </div>
            <div className="p-6 border-t-2 border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => { setShowAssignModal(false); setIncidentToAssign(null); setAssigneeInput(''); }}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssign(incidentToAssign)}
                disabled={actionLoading === incidentToAssign || !assigneeInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Mortem Modal */}
      {showPostMortem && postMortem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPostMortem(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl border-2 border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-200 dark:border-slate-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <FileText className="h-7 w-7 text-green-600" />
                    Post-Mortem Report
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Incident analysis and resolution summary</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPostMortem}
                    className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-all"
                    title="Copy to Clipboard"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={downloadPostMortem}
                    className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-all"
                    title="Download as Markdown"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowPostMortem(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Close"
                  >
                    <XCircle className="h-6 w-6 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-mono leading-relaxed">
                {postMortem}
              </pre>
            </div>
            <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t-2 border-slate-200 dark:border-slate-700 p-6">
              <button
                onClick={() => setShowPostMortem(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 ${
            toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-700'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
            )}
            <p className={`font-semibold ${
              toast.type === 'success' 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
