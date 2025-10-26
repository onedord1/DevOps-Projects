'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, TrendingUp, ArrowRight, Activity } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'
import type { IncidentStats } from '@/types'

export function IncidentWidget() {
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIncidentStats()
    // Refresh every 30 seconds
    const interval = setInterval(loadIncidentStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadIncidentStats = async () => {
    try {
      const response = await apiClient.getIncidentStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load incident stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const totalActiveIncidents = stats.open_incidents + stats.acknowledged_incidents + stats.investigating_incidents

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 overflow-hidden shadow-lg hover:shadow-xl transition-all">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Incidents</h3>
          </div>
          {totalActiveIncidents > 0 && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-red-600 dark:text-red-400">
            {totalActiveIncidents}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {totalActiveIncidents === 1 ? 'incident' : 'incidents'} requiring attention
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 pt-4 space-y-3">
        {/* Critical Incidents */}
        {stats.critical_incidents > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Critical</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Immediate attention needed</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.critical_incidents}
            </span>
          </div>
        )}

        {/* Active Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Open</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.open_incidents}</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Acknowledged</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.acknowledged_incidents}</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Investigating</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.investigating_incidents}</p>
          </div>
        </div>

        {/* Resolved Today */}
        {stats.resolved_today > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-gray-700 dark:text-gray-300">Resolved Today</p>
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {stats.resolved_today}
            </span>
          </div>
        )}

        {/* View All Link */}
        <Link 
          href="/dashboard/incidents"
          className="flex items-center justify-center gap-2 w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors group"
        >
          <span>View All Incidents</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* No Active Incidents State */}
        {totalActiveIncidents === 0 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">All Clear! 🎉</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">No active incidents at the moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
