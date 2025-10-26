'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { X, ExternalLink, TrendingUp, Clock, AlertCircle, Activity, CheckCircle2, XCircle, Calendar, Zap, Edit2, Trash2 } from 'lucide-react'
import { formatDate, formatDuration, getStatusBadgeColor } from '@/lib/utils'
import type { Endpoint } from '@/types'

interface ServiceDetailDialogProps {
  endpoint: Endpoint
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ServiceDetailDialog({ endpoint, open, onOpenChange, onUpdate, onEdit, onDelete }: ServiceDetailDialogProps) {
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['endpoint-history', endpoint.id],
    queryFn: async () => {
      const response = await apiClient.getEndpointHistory(endpoint.id, 7)
      return response.data
    },
    enabled: open,
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['endpoint-stats', endpoint.id],
    queryFn: async () => {
      const response = await apiClient.getEndpointStats(endpoint.id)
      return response.data
    },
    enabled: open,
  })

  if (!open) return null

  const history = historyData || {}
  const stats = statsData || {}

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 transform animate-in zoom-in-95 duration-300">
        {/* Gradient Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{endpoint.name}</h2>
                <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  {endpoint.url}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-semibold text-sm backdrop-blur-sm ${
                endpoint.status === 'UP' 
                  ? 'bg-green-500/90 text-white' 
                  : endpoint.status === 'PARTIAL_OUTAGE' 
                  ? 'bg-yellow-500/90 text-white' 
                  : 'bg-red-500/90 text-white'
              }`}>
                {endpoint.status === 'UP' && <CheckCircle2 className="inline h-4 w-4 mr-1" />}
                {endpoint.status === 'DOWN' && <XCircle className="inline h-4 w-4 mr-1" />}
                {endpoint.status.replace('_', ' ')}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit()}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                title="Edit service"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete()}
                className="bg-white/20 hover:bg-red-500/30 text-white border-0"
                title="Delete service"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(endpoint.url, '_blank')}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
          {/* Modern Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 opacity-20">
                <TrendingUp className="h-24 w-24 transform rotate-12" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-green-100">Uptime (30d)</span>
                </div>
                <p className="text-3xl font-bold">
                  {statsLoading ? '...' : `${stats.uptime_percentage?.toFixed(2) || '0'}%`}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 opacity-20">
                <Zap className="h-24 w-24 transform rotate-12" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-blue-100">Avg Response</span>
                </div>
                <p className="text-3xl font-bold">
                  {statsLoading ? '...' : `${stats.avg_response_time_ms?.toFixed(0) || '0'}ms`}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 opacity-20">
                <Activity className="h-24 w-24 transform rotate-12" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-purple-100">Total Checks</span>
                </div>
                <p className="text-3xl font-bold">
                  {historyLoading ? '...' : history.total_checks || '0'}
                </p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Service Type</p>
                <p className="font-semibold text-lg capitalize text-slate-900 dark:text-white">{endpoint.service_type}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Check Interval</p>
                <p className="font-semibold text-lg text-slate-900 dark:text-white">{endpoint.check_interval_seconds}s</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Timeout</p>
                <p className="font-semibold text-lg text-slate-900 dark:text-white">{endpoint.timeout_seconds}s</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Failure Threshold</p>
                <p className="font-semibold text-lg text-slate-900 dark:text-white">{endpoint.failure_threshold_minutes} min</p>
              </div>
            </div>
          </div>

          {endpoint.description && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Description</h3>
              <p className="text-slate-700 dark:text-slate-300">{endpoint.description}</p>
            </div>
          )}

          {endpoint.tags && endpoint.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {endpoint.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Checks */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Recent Checks (Last 7 Days)
            </h3>
            {historyLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-500">Loading history...</p>
              </div>
            ) : history.checks && history.checks.length > 0 ? (
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 sticky top-0 z-10">
                      <tr>
                        <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Time</th>
                        <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Response Time</th>
                        <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.checks.slice(0, 50).map((check: any, idx: number) => (
                        <tr 
                          key={check.id} 
                          className={`border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                          }`}
                        >
                          <td className="p-4 text-slate-600 dark:text-slate-400">{formatDate(check.checked_at)}</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                check.check_status === 'success'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              }`}
                            >
                              {check.check_status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {check.check_status}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                            {check.response_time_ms ? `${check.response_time_ms}ms` : '-'}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {check.failure_reason || check.status_code || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No check history available</p>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Created</p>
                <p className="text-slate-900 dark:text-white font-semibold">{formatDate(endpoint.created_at)}</p>
              </div>
              {endpoint.last_check_at && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Last Check</p>
                  <p className="text-slate-900 dark:text-white font-semibold">{formatDate(endpoint.last_check_at)}</p>
                </div>
              )}
              {endpoint.last_status_change_at && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Last Status Change</p>
                  <p className="text-slate-900 dark:text-white font-semibold">{formatDate(endpoint.last_status_change_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
