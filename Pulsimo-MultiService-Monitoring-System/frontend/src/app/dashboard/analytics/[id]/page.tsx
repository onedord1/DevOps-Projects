'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface UptimeMetrics {
  endpoint_id: string
  endpoint_name: string
  period: string
  uptime_percentage: number
  total_checks: number
  successful_checks: number
  failed_checks: number
  avg_response_time_ms: number
  min_response_time_ms: number
  max_response_time_ms: number
  p95_response_time_ms: number
  total_downtime_minutes: number
}

interface ResponseTimeDataPoint {
  timestamp: string
  avg_response_time_ms: number
  min_response_time_ms: number
  max_response_time_ms: number
  status: string
}

interface DowntimePeriod {
  start_time: string
  end_time: string | null
  duration_minutes: number
  status: string
  ongoing: boolean
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const endpointId = params.id as string

  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<UptimeMetrics | null>(null)
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeDataPoint[]>([])
  const [downtimePeriods, setDowntimePeriods] = useState<DowntimePeriod[]>([])
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [responseTimeFilter, setResponseTimeFilter] = useState<string>('all')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadAnalytics()
  }, [endpointId, period])

  // Auto-refresh with polling (fallback since WebSocket not implemented yet)
  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing analytics data...')
      loadAnalytics()
      setLastUpdate(new Date())
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [endpointId, period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [metricsData, responseData, downtimeData] = await Promise.all([
        apiClient.getUptimeMetrics(endpointId, period),
        apiClient.getResponseTimeData(endpointId, period),
        apiClient.getDowntimePeriods(endpointId, period),
      ])
      
      setMetrics(metricsData.data || null)
      setResponseTimeData(responseData.data || [])
      setDowntimePeriods(downtimeData.data || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Compute status distribution data for pie chart
  const getStatusDistribution = () => {
    if (!metrics) return []
    
    const total = metrics.total_checks
    const up = metrics.successful_checks
    const down = metrics.failed_checks
    
    return [
      { name: 'UP', value: up, percentage: ((up / total) * 100).toFixed(1) },
      { name: 'DOWN', value: down, percentage: ((down / total) * 100).toFixed(1) },
    ]
  }

  // Compute hourly check distribution for bar chart
  const getHourlyDistribution = () => {
    const hourlyData: { [key: number]: { total: number, up: number, down: number } } = {}
    
    responseTimeData.forEach(point => {
      const hour = new Date(point.timestamp).getHours()
      if (!hourlyData[hour]) {
        hourlyData[hour] = { total: 0, up: 0, down: 0 }
      }
      hourlyData[hour].total++
      if (point.status === 'UP') {
        hourlyData[hour].up++
      } else {
        hourlyData[hour].down++
      }
    })
    
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      total: hourlyData[i]?.total || 0,
      up: hourlyData[i]?.up || 0,
      down: hourlyData[i]?.down || 0,
    }))
  }

  // Apply filters to response time data
  const getFilteredData = () => {
    let filtered = responseTimeData

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter)
    }

    if (responseTimeFilter === 'fast') {
      filtered = filtered.filter(d => (d.avg_response_time_ms || 0) < 100)
    } else if (responseTimeFilter === 'medium') {
      filtered = filtered.filter(d => (d.avg_response_time_ms || 0) >= 100 && (d.avg_response_time_ms || 0) < 500)
    } else if (responseTimeFilter === 'slow') {
      filtered = filtered.filter(d => (d.avg_response_time_ms || 0) >= 500)
    }

    return filtered
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No data available</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Analytics data will appear once checks are performed
          </p>
        </div>
      </div>
    )
  }

  const uptimeColor = metrics.uptime_percentage >= 99.9 ? 'text-green-600' : 
                      metrics.uptime_percentage >= 99 ? 'text-yellow-600' : 'text-red-600'
  
  // Compute chart data
  const statusDistribution = getStatusDistribution()
  const hourlyDistribution = getHourlyDistribution()
  const filteredResponseData = getFilteredData()
  
  // Colors for charts
  const COLORS = {
    UP: '#10b981',
    DOWN: '#ef4444',
    DEGRADED: '#f59e0b'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Back Icon Button */}
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="h-12 w-1 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {metrics.endpoint_name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                      Analytics for the past {period}
                    </p>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Auto-refresh (30s) • Last: {lastUpdate.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
              {['24h', '7d', '30d', '90d'].map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={period === p 
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40' 
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Uptime Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-shadow">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  metrics.uptime_percentage >= 99.9 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  metrics.uptime_percentage >= 99 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {metrics.uptime_percentage >= 99.9 ? 'Excellent' : metrics.uptime_percentage >= 99 ? 'Good' : 'Poor'}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Uptime</p>
                <p className={`text-4xl font-bold ${uptimeColor} mb-2`}>
                  {metrics.uptime_percentage.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                  <span className="font-semibold">{metrics.successful_checks.toLocaleString()}</span>
                  <span>/</span>
                  <span>{metrics.total_checks.toLocaleString()}</span>
                  <span>checks</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Avg Response Time Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Average
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Response Time</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {metrics.avg_response_time_ms || 0}
                  <span className="text-lg text-slate-500">ms</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  P95: <span className="font-semibold text-slate-600 dark:text-slate-400">{metrics.p95_response_time_ms || 0}ms</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Total Downtime Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 dark:from-red-500/10 dark:to-rose-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-shadow">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {downtimePeriods.length} events
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Total Downtime</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {formatDuration(metrics.total_downtime_minutes)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Across <span className="font-semibold text-slate-600 dark:text-slate-400">{downtimePeriods.length}</span> incidents
                </p>
              </div>
            </div>
          </Card>

          {/* Failed Checks Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  {((metrics.failed_checks / metrics.total_checks) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Failed Checks</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {metrics.failed_checks.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  of <span className="font-semibold text-slate-600 dark:text-slate-400">{metrics.total_checks.toLocaleString()}</span> total checks
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters:</span>
              
              {/* Status Filter */}
              <div className="flex space-x-2">
                {['all', 'UP', 'DOWN', 'DEGRADED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === status
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {status === 'all' ? 'All Status' : status}
                  </button>
                ))}
              </div>

              {/* Response Time Filter */}
              <div className="flex space-x-2">
                {[
                  { value: 'all', label: 'All Times' },
                  { value: 'fast', label: '<100ms' },
                  { value: 'medium', label: '100-500ms' },
                  { value: 'slow', label: '>500ms' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setResponseTimeFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      responseTimeFilter === filter.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Info */}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Showing {filteredResponseData.length} of {responseTimeData.length} data points
            </div>
          </div>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-green-500/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Status Distribution
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Breakdown of check results
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-96 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="gradientGreen" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="gradientRed" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                      </linearGradient>
                      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="45%"
                      labelLine={{
                        stroke: '#94a3b8',
                        strokeWidth: 2,
                      }}
                      label={({cx, cy, midAngle, innerRadius, outerRadius, name, percentage, value}) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 30;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill={name === 'UP' ? '#10b981' : '#ef4444'}
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            className="font-bold"
                            style={{ fontSize: '14px', fontWeight: 700 }}
                          >
                            <tspan x={x} dy="0" style={{ fontSize: '16px', fontWeight: 800 }}>
                              {name}
                            </tspan>
                            <tspan x={x} dy="18" style={{ fontSize: '14px', fontWeight: 600, fill: '#64748b' }}>
                              {percentage}%
                            </tspan>
                            <tspan x={x} dy="16" style={{ fontSize: '12px', fill: '#94a3b8' }}>
                              ({value.toLocaleString()} checks)
                            </tspan>
                          </text>
                        );
                      }}
                      outerRadius={110}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === 'UP' ? 'url(#gradientGreen)' : 'url(#gradientRed)'}
                          filter="url(#shadow)"
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        padding: '16px',
                      }}
                      itemStyle={{
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                      formatter={(value: any) => [`${value.toLocaleString()} checks`, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {metrics.total_checks.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">checks</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Hourly Check Distribution Bar Chart */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-blue-500/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Hourly Distribution
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Checks by hour of day
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={hourlyDistribution}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="barGradientRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
                      </filter>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      opacity={0.3}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      label={{ 
                        value: 'Number of Checks', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { 
                          fontSize: 12, 
                          fill: '#64748b',
                          fontWeight: 600
                        }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        padding: '16px',
                      }}
                      itemStyle={{
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '13px',
                        padding: '4px 0',
                      }}
                      labelStyle={{
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '14px',
                        marginBottom: '8px',
                      }}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                      }}
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => (
                        <span style={{ 
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '13px',
                          marginLeft: '5px'
                        }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar 
                      dataKey="up" 
                      fill="url(#barGradientGreen)" 
                      name="Successful (UP)"
                      radius={[6, 6, 0, 0]}
                      filter="url(#barShadow)"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="down" 
                      fill="url(#barGradientRed)" 
                      name="Failed (DOWN)"
                      radius={[6, 6, 0, 0]}
                      filter="url(#barShadow)"
                      animationBegin={100}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Response Time Chart */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-violet-500/10 dark:from-violet-500/20 dark:via-purple-500/20 dark:to-violet-500/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Response Time Trend
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Performance over time
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-xs font-semibold text-violet-700 dark:text-violet-300">
                {filteredResponseData.length} data points
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredResponseData}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `${value}ms`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    labelStyle={{
                      color: '#1e293b',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg_response_time_ms"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAvg)"
                    name="Avg Response Time (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Downtime Periods */}
        {downtimePeriods.length > 0 && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/10 dark:from-red-500/20 dark:via-rose-500/20 dark:to-red-500/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Downtime Periods
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Incident history and durations
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-xs font-semibold text-red-700 dark:text-red-300">
                  {downtimePeriods.length} {downtimePeriods.length === 1 ? 'incident' : 'incidents'}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {downtimePeriods.map((period, idx) => (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      period.ongoing 
                        ? 'bg-gradient-to-b from-red-500 to-rose-600' 
                        : period.status === 'DOWN'
                        ? 'bg-gradient-to-b from-red-400 to-red-500'
                        : 'bg-gradient-to-b from-yellow-400 to-yellow-500'
                    }`}></div>
                    
                    <div className="flex items-center justify-between p-5 pl-6">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`relative flex items-center justify-center h-10 w-10 rounded-full ${
                          period.ongoing 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-slate-100 dark:bg-slate-700'
                        }`}>
                          {period.ongoing && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                          )}
                          <Clock className={`relative h-5 w-5 ${
                            period.ongoing 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-slate-500 dark:text-slate-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                              {formatDateTime(period.start_time)}
                            </p>
                            {period.end_time && (
                              <>
                                <span className="text-slate-400">→</span>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                  {formatDateTime(period.end_time)}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                              Duration:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatDuration(period.duration_minutes)}
                            </span>
                            {period.ongoing && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                Ongoing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${
                        period.status === 'DOWN' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {period.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
