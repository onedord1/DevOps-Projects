'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Activity, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface StatsProps {
  stats: {
    total: number
    up: number
    down: number
    partialOutage: number
  }
}

export function StatsOverview({ stats }: StatsProps) {
  const upPercentage = stats.total > 0 ? ((stats.up / stats.total) * 100).toFixed(1) : '0'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Services Card */}
      <Card className="border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                  <Activity className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Services</p>
              </div>
              <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">{stats.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Active Monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Healthy Card */}
      <Card className="border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Healthy</p>
              </div>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">{stats.up}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-2 flex-1 bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${upPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">{upPercentage}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Degraded Card */}
      <Card className="border-2 border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Degraded</p>
              </div>
              <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mt-3">{stats.partialOutage}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 font-medium">
                {stats.partialOutage > 0 ? 'Needs Attention' : 'All Systems Normal'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Down Card */}
      <Card className="border-2 border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-lg">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Down</p>
              </div>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-3">{stats.down}</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-2 font-medium">
                {stats.down > 0 ? `${stats.down} ${stats.down === 1 ? 'Service' : 'Services'} Offline` : 'No Outages'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
