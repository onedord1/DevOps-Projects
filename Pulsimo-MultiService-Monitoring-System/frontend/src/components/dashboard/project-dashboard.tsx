'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  AlertCircle,
  Server,
  Timer,
  Calendar,
  BarChart3
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface ProjectDashboardProps {
  projectId: string
  projectName: string
  projectColor: string
}

export function ProjectDashboard({ projectId, projectName, projectColor }: ProjectDashboardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-dashboard', projectId],
    queryFn: async () => {
      const response = await apiClient.getProjectDashboard(projectId)
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-400 font-semibold">Failed to load dashboard data</p>
      </div>
    )
  }

  const {
    health_score,
    total_services,
    service_status,
    uptime_30d,
    mttr_minutes,
    active_incidents,
    incidents_this_month,
    uptime_trend,
    top_problematic_services,
  } = data

  // Chart data for uptime trend
  const chartData = uptime_trend.map((point: any) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uptime: point.uptime_percentage,
  }))

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBg = (score: number) => {
    if (score >= 95) return 'bg-green-500'
    if (score >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{projectName} Dashboard</h2>
        <p className="text-purple-100">Real-time project health and performance metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <TrendingUp className={`h-5 w-5 ${getHealthColor(health_score)}`} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Health Score</p>
          <p className={`text-3xl font-bold ${getHealthColor(health_score)}`}>
            {health_score.toFixed(1)}%
          </p>
          <div className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full ${getHealthBg(health_score)} transition-all duration-500`}
              style={{ width: `${health_score}%` }}
            />
          </div>
        </div>

        {/* Total Services */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <Server className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Total Services</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{total_services}</p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" /> {service_status.up} UP
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" /> {service_status.down} DOWN
            </span>
          </div>
        </div>

        {/* 30-Day Uptime */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">30-Day Uptime</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {uptime_30d.toFixed(2)}%
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Last 30 days average
          </p>
        </div>

        {/* MTTR */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Timer className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">MTTR</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {mttr_minutes.toFixed(0)}<span className="text-lg">min</span>
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Mean time to recovery
          </p>
        </div>
      </div>

      {/* Service Status & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Service Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-violet-600" />
            Service Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Healthy</span>
              </div>
              <span className="text-sm font-bold text-green-600">{service_status.up}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Down</span>
              </div>
              <span className="text-sm font-bold text-red-600">{service_status.down}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Degraded</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{service_status.degraded}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Unknown</span>
              </div>
              <span className="text-sm font-bold text-gray-600">{service_status.unknown}</span>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Active Incidents
          </h3>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {active_incidents}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Currently active
            </p>
          </div>
        </div>

        {/* Monthly Incidents */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            This Month
          </h3>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {incidents_this_month}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total incidents
            </p>
          </div>
        </div>
      </div>

      {/* Uptime Trend Chart */}
      {uptime_trend.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            30-Day Uptime Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={projectColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={projectColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`${value.toFixed(2)}%`, 'Uptime']}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke={projectColor}
                  strokeWidth={2}
                  fill="url(#colorUptime)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Problematic Services */}
      {top_problematic_services.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Top 5 Problematic Services
          </h3>
          <div className="space-y-3">
            {top_problematic_services.map((service: any, index: number) => (
              <div 
                key={service.id} 
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{service.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{service.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Incidents</p>
                    <p className="font-bold text-red-600 dark:text-red-400">{service.incident_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Downtime</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400">{service.total_downtime_minutes}m</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">MTTR</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400">{service.mttr_minutes.toFixed(0)}m</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
