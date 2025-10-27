'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Bell, BellOff, Clock, Infinity, Loader2, Trash2, Volume2, VolumeX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface NotificationChannel {
  id: string
  name: string
  channel_type: string
}

interface ActiveSilence {
  id: string
  endpoint_id: string
  endpoint_name: string
  channel_id: string | null
  channel_name: string | null
  org_id: string
  created_by: string
  created_by_name: string
  silence_type: 'temporary' | 'permanent'
  starts_at: string
  expires_at: string | null
  is_active: boolean
  reason: string | null
  created_at: string
  updated_at: string
}

interface SilenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint: {
    id: string
    name: string
  }
  onSilenceCreated?: () => void
}

const DURATION_PRESETS = [
  { label: '1 hour', value: 60, icon: '⏱️' },
  { label: '4 hours', value: 240, icon: '🕐' },
  { label: '12 hours', value: 720, icon: '🕛' },
  { label: '24 hours', value: 1440, icon: '📅' },
  { label: '3 days', value: 4320, icon: '📆' },
  { label: '1 week', value: 10080, icon: '🗓️' },
]

export function SilenceDialog({ open, onOpenChange, endpoint, onSilenceCreated }: SilenceDialogProps) {
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set())
  const [silenceAll, setSilenceAll] = useState<boolean>(false)
  const [activeSilences, setActiveSilences] = useState<ActiveSilence[]>([])
  const [silenceType, setSilenceType] = useState<'temporary' | 'permanent'>('temporary')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [customDuration, setCustomDuration] = useState<string>('60')
  const [reason, setReason] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'create' | 'manage'>('create')
  const { toast } = useToast()

  // Load notification channels and active silences
  useEffect(() => {
    if (open) {
      loadData()
    } else {
      // Reset state when closing
      setView('create')
      setSelectedChannelIds(new Set())
      setSilenceAll(false)
      setReason('')
      setDurationMinutes(60)
      setCustomDuration('60')
      setSilenceType('temporary')
    }
  }, [open])

  const loadData = async () => {
    try {
      // Load channels
      const channelsResponse = await apiClient.getNotificationChannels()
      if (channelsResponse.success && channelsResponse.data) {
        setChannels(channelsResponse.data)
      }

      // Load active silences for this endpoint
      const silencesResponse = await apiClient.getEndpointSilenceStatus(endpoint.id)
      if (silencesResponse.success && silencesResponse.data) {
        setActiveSilences(silencesResponse.data)
        
        // Set initial view based on whether silences exist
        if (silencesResponse.data.length > 0) {
          setView('manage')
        } else {
          setView('create')
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleDurationChange = (value: number) => {
    setDurationMinutes(value)
    setCustomDuration(value.toString())
  }

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value)
    const parsed = parseInt(value)
    if (!isNaN(parsed) && parsed > 0) {
      setDurationMinutes(parsed)
    }
  }

  const handleToggleChannel = (channelId: string) => {
    const newSet = new Set(selectedChannelIds)
    if (newSet.has(channelId)) {
      newSet.delete(channelId)
    } else {
      newSet.add(channelId)
    }
    setSelectedChannelIds(newSet)
    setSilenceAll(false) // Uncheck "all" if individual channels are selected
  }

  const handleToggleSilenceAll = () => {
    setSilenceAll(!silenceAll)
    if (!silenceAll) {
      setSelectedChannelIds(new Set()) // Clear individual selections
    }
  }

  const handleUnmute = async (channelId: string | null, channelName?: string | null) => {
    try {
      await apiClient.unmuteEndpoint(endpoint.id, channelId)
      toast({
        title: '🔔 Notifications Unmuted',
        description: `${endpoint.name} ${channelName ? `on ${channelName}` : '(all channels)'}`,
      })
      loadData()
      onSilenceCreated?.()
    } catch (error) {
      console.error('Failed to unmute:', error)
      toast({
        title: 'Error',
        description: 'Failed to unmute notifications',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async () => {
    // Validate selection
    if (!silenceAll && selectedChannelIds.size === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one channel or "All Channels"',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const channelsToSilence = silenceAll 
        ? [null] // null means all channels
        : Array.from(selectedChannelIds)

      let successCount = 0

      // Create silences for each selected channel
      for (const channelId of channelsToSilence) {
        const silenceData = {
          endpoint_id: endpoint.id,
          channel_id: channelId as string | null,
          reason: reason.trim() || undefined,
          silence_type: silenceType,
          duration_minutes: silenceType === 'temporary' ? durationMinutes : undefined,
        }

        const response = await apiClient.createSilence(silenceData)
        if (response.success) {
          successCount++
        }
      }

      if (successCount > 0) {
        const durationText = silenceType === 'temporary' 
          ? durationMinutes < 60 
            ? `${durationMinutes} minutes` 
            : `${Math.floor(durationMinutes / 60)} hours`
          : 'until manually unmuted';

        const channelText = silenceAll 
          ? 'all channels'
          : `${successCount} channel${successCount > 1 ? 's' : ''}`

        toast({
          title: '🔕 Notifications Silenced',
          description: `${endpoint.name} on ${channelText} - ${silenceType === 'temporary' ? `Will resume after ${durationText}` : `Silenced ${durationText}`}`,
        })

        // Reset form
        setSelectedChannelIds(new Set())
        setSilenceAll(false)
        setSilenceType('temporary')
        setDurationMinutes(60)
        setCustomDuration('60')
        setReason('')
        
        onOpenChange(false)
        onSilenceCreated?.()
      }
    } catch (error) {
      console.error('Failed to create silence:', error)
      toast({
        title: 'Error',
        description: 'Failed to silence notifications',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeRemaining = (expiresAt?: string | null) => {
    if (!expiresAt) return 'Permanent'
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Expired'
    
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m remaining`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h remaining`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d remaining`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <BellOff className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Silence Notifications</DialogTitle>
              <DialogDescription>
                {endpoint.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs for Create vs Manage */}
        {activeSilences.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={view === 'create' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('create')}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              Create Silence
            </Button>
            <Button
              variant={view === 'manage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('manage')}
              className="flex-1"
            >
              <VolumeX className="h-4 w-4 mr-2" />
              Manage ({activeSilences.length})
            </Button>
          </div>
        )}

        {/* Manage View - Show Active Silences */}
        {view === 'manage' && activeSilences.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Active Silences
            </Label>
            {activeSilences.map((silence) => (
              <div
                key={silence.id}
                className="flex items-center justify-between p-4 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <VolumeX className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="font-medium text-sm">
                      {silence.channel_id === null ? 'All Channels' : (silence.channel_name || 'Unknown Channel')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {silence.silence_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {formatTimeRemaining(silence.expires_at)}
                  </div>
                  {silence.reason && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">
                      "{silence.reason}"
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnmute(silence.channel_id, silence.channel_name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Unmute
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Create View - Silence Form */}
        {view === 'create' && (
          <div className="space-y-6">
            {/* Channel Selection with Checkboxes */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Which notification channels?
              </Label>
              
              {/* All Channels Checkbox */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <Checkbox
                  id="channel-all"
                  checked={silenceAll}
                  onCheckedChange={handleToggleSilenceAll}
                />
                <label
                  htmlFor="channel-all"
                  className="flex-1 flex items-center gap-2 cursor-pointer"
                >
                  <BellOff className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-medium">All Channels</span>
                  <Badge variant="outline" className="ml-auto">Global</Badge>
                </label>
              </div>

              {/* Individual Channel Checkboxes */}
              <div className="space-y-2">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <Checkbox
                      id={`channel-${channel.id}`}
                      checked={selectedChannelIds.has(channel.id)}
                      onCheckedChange={() => handleToggleChannel(channel.id)}
                      disabled={silenceAll}
                    />
                    <label
                      htmlFor={`channel-${channel.id}`}
                      className="flex-1 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-medium">{channel.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {channel.channel_type}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Silence Type */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                How long?
              </Label>
              <RadioGroup value={silenceType} onValueChange={(value: any) => setSilenceType(value)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <RadioGroupItem value="temporary" id="type-temp" />
                  <Label htmlFor="type-temp" className="flex-1 cursor-pointer font-medium">
                    ⏱️ Temporary
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <RadioGroupItem value="permanent" id="type-perm" />
                  <Label htmlFor="type-perm" className="flex-1 cursor-pointer font-medium">
                    ♾️ Permanent
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Duration Presets (only for temporary) */}
            {silenceType === 'temporary' && (
              <div className="space-y-3">
                <Label className="text-sm text-slate-600 dark:text-slate-400">Select Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={durationMinutes === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleDurationChange(preset.value)}
                      className="flex items-center gap-2"
                    >
                      <span>{preset.icon}</span>
                      <span className="text-xs">{preset.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Custom Duration */}
                <div className="space-y-2">
                  <Label htmlFor="custom-duration" className="text-sm text-slate-600 dark:text-slate-400">
                    Custom (minutes)
                  </Label>
                  <Input
                    id="custom-duration"
                    type="number"
                    min="1"
                    max="43200"
                    value={customDuration}
                    onChange={(e) => handleCustomDurationChange(e.target.value)}
                    placeholder="Enter minutes"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                📝 Reason (optional)
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Scheduled maintenance window"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-slate-500 text-right">{reason.length}/500 characters</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {view === 'create' && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Silencing...
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Silence Notifications
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
