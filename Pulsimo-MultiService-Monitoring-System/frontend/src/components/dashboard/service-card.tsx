'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, getStatusBadgeColor, formatRelativeTime, cn } from '@/lib/utils'
import { ExternalLink, Clock, Activity, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Edit2, Trash2, Bell, BellOff, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Endpoint } from '@/types'
import { ServiceDetailDialog } from './service-detail-dialog'
import { EditEndpointDialog } from './edit-endpoint-dialog'
import { SilenceDialog } from '../silence-dialog'
import { apiClient } from '@/lib/api-client'

interface ServiceCardProps {
  endpoint: Endpoint
  onUpdate: () => void
}

export function ServiceCard({ endpoint, onUpdate }: ServiceCardProps) {
  const router = useRouter()
  const [showDetail, setShowDetail] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSilence, setShowSilence] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [silenceStatus, setSilenceStatus] = useState<any[]>([])
  const [isLoadingSilences, setIsLoadingSilences] = useState(false)

  // Load silence status when component mounts or endpoint changes
  useEffect(() => {
    loadSilenceStatus()
  }, [endpoint.id])

  const loadSilenceStatus = async () => {
    try {
      setIsLoadingSilences(true)
      const response = await apiClient.getEndpointSilenceStatus(endpoint.id)
      if (response.success && response.data) {
        setSilenceStatus(response.data)
      }
    } catch (error) {
      console.error('Failed to load silence status:', error)
    } finally {
      setIsLoadingSilences(false)
    }
  }

  const handleStatusChange = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const statusColor = getStatusColor(endpoint.status)
  const badgeColor = getStatusBadgeColor(endpoint.status)

  // Get status styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'UP':
        return {
          border: 'border-l-4 border-green-500',
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
          badge: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          glow: 'shadow-green-500/20'
        }
      case 'PARTIAL_OUTAGE':
        return {
          border: 'border-l-4 border-yellow-500',
          bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
          badge: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          glow: 'shadow-yellow-500/20'
        }
      case 'DOWN':
        return {
          border: 'border-l-4 border-red-500',
          bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
          badge: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          glow: 'shadow-red-500/20'
        }
      default:
        return {
          border: 'border-l-4 border-slate-400',
          bg: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30',
          badge: 'bg-gradient-to-r from-slate-500 to-gray-500 text-white',
          icon: <HelpCircle className="h-5 w-5 text-slate-400" />,
          glow: 'shadow-slate-500/20'
        }
    }
  }

  const statusStyles = getStatusStyles(endpoint.status)

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300 hover:shadow-2xl group overflow-hidden',
          statusStyles.border,
          statusStyles.bg,
          statusStyles.glow,
          isAnimating && 'status-change-animation'
        )}
        onClick={() => setShowDetail(true)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Status Icon */}
              <div className="mt-0.5">
                {statusStyles.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {endpoint.name}
                  </h3>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-bold shadow-md', statusStyles.badge)}>
                    {endpoint.status === 'UP' ? 'ONLINE' : 
                     endpoint.status === 'DOWN' ? 'OFFLINE' : 
                     endpoint.status === 'PARTIAL_OUTAGE' ? 'DEGRADED' : 
                     'UNKNOWN'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate font-medium">{endpoint.url}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSilence(true)
                }}
                className={`p-2 rounded-lg transition-all duration-200 group/btn relative ${
                  silenceStatus.length > 0 
                    ? 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70' 
                    : 'hover:bg-violet-100 dark:hover:bg-violet-900/50'
                }`}
                title={silenceStatus.length > 0 ? `${silenceStatus.length} active silence(s)` : 'Silence notifications'}
              >
                {silenceStatus.length > 0 ? (
                  <BellOff className="h-4 w-4 text-violet-600 dark:text-violet-400 animate-pulse" />
                ) : (
                  <Bell className="h-4 w-4 text-slate-500 group-hover/btn:text-violet-600 dark:group-hover/btn:text-violet-400 transition-colors" />
                )}
                {silenceStatus.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-violet-500 text-white text-[10px] items-center justify-center font-bold">
                      {silenceStatus.length}
                    </span>
                  </span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEdit(true)
                }}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all duration-200 group/btn"
                title="Edit service"
              >
                <Edit2 className="h-4 w-4 text-slate-500 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all duration-200 group/btn"
                title="Delete service"
              >
                <Trash2 className="h-4 w-4 text-slate-500 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400 transition-colors" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(endpoint.url, '_blank')
                }}
                className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 group/btn"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4 text-slate-500 group-hover/btn:text-blue-600 dark:group-hover/btn:text-cyan-400 transition-colors" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/dashboard/analytics/${endpoint.id}`)
                }}
                className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 group/btn"
                title="View Analytics"
              >
                <BarChart3 className="h-4 w-4 text-slate-500 group-hover/btn:text-violet-600 dark:group-hover/btn:text-violet-400 transition-colors" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Service Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">Service Type</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{endpoint.service_type}</p>
            </div>
            
            {endpoint.last_check_at && (
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Check
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatRelativeTime(endpoint.last_check_at)}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {endpoint.tags && endpoint.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {endpoint.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                </span>
              ))}
              {endpoint.tags.length > 3 && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700">
                  +{endpoint.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Status Change Notice */}
          {endpoint.last_status_change_at && endpoint.status !== 'UP' && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Status changed {formatRelativeTime(endpoint.last_status_change_at)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceDetailDialog
        endpoint={endpoint}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={() => {
          onUpdate()
          handleStatusChange()
        }}
        onEdit={() => {
          setShowDetail(false)
          setShowEdit(true)
        }}
        onDelete={() => {
          setShowDetail(false)
          setShowDeleteConfirm(true)
        }}
      />

      <EditEndpointDialog
        endpoint={endpoint}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={() => {
          onUpdate()
          handleStatusChange()
        }}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Service</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{endpoint.name}</strong>? All monitoring data and history will be permanently removed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    await apiClient.deleteEndpoint(endpoint.id)
                    onUpdate()
                    setShowDeleteConfirm(false)
                  } catch (error) {
                    console.error('Failed to delete endpoint:', error)
                    alert('Failed to delete service. Please try again.')
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Silence Dialog */}
      <SilenceDialog
        open={showSilence}
        onOpenChange={setShowSilence}
        endpoint={{ id: endpoint.id, name: endpoint.name }}
        onSilenceCreated={() => {
          onUpdate()
          loadSilenceStatus() // Reload silence status after creating/removing
        }}
      />
    </>
  )
}
