'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, Plus, Trash2, Mail, MessageSquare, Webhook, 
  Send, CheckCircle, XCircle, Loader2, Zap, MessageCircle,
  Video, Hash, Edit, AlertTriangle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface NotificationChannel {
  id: string
  name: string
  channel_type: 'email' | 'slack' | 'discord' | 'webhook' | 'msteams' | 'googlechat'
  config: Record<string, any>
  is_active: boolean
  repeat_interval_minutes: number
  created_at: string
}

const channelPlatforms = {
  slack: {
    name: 'Slack',
    icon: Hash,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-600 dark:text-purple-400',
    description: 'Send alerts to Slack channels with rich formatting',
  },
  discord: {
    name: 'Discord',
    icon: MessageCircle,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    description: 'Post notifications to Discord with embeds',
  },
  msteams: {
    name: 'Microsoft Teams',
    icon: Video,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-600 dark:text-blue-400',
    description: 'Notify your team via Microsoft Teams',
  },
  googlechat: {
    name: 'Google Chat',
    icon: MessageSquare,
    color: 'from-green-500 to-teal-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-600 dark:text-green-400',
    description: 'Send alerts to Google Chat spaces',
  },
  email: {
    name: 'Email',
    icon: Mail,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-600 dark:text-orange-400',
    description: 'Traditional email notifications',
  },
  webhook: {
    name: 'Custom Webhook',
    icon: Webhook,
    color: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    textColor: 'text-gray-600 dark:text-gray-400',
    description: 'Send to any HTTP endpoint',
  },
}

export default function NotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [testingChannel, setTestingChannel] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    channel_type: 'email' | 'slack' | 'discord' | 'webhook' | 'msteams' | 'googlechat'
    config: Record<string, any>
    repeat_interval_minutes?: number
  }>({
    name: '',
    channel_type: 'slack',
    config: {},
    repeat_interval_minutes: 15,
  })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }
    loadChannels()
  }, [router])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getNotificationChannels()
      if (response.success && response.data) {
        setChannels(response.data)
      }
    } catch (error) {
      console.error('Failed to load notification channels:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notification channels',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Format config based on channel type
      const config = formatConfig(formData.channel_type, formData.config)
      
      if (isEditMode && editingChannelId) {
        // Update existing channel
        await apiClient.updateNotificationChannel(editingChannelId, {
          ...formData,
          config,
        })
        toast({
          title: 'Success',
          description: 'Notification channel updated successfully',
        })
      } else {
        // Create new channel
        await apiClient.createNotificationChannel({
          ...formData,
          config,
        })
        toast({
          title: 'Success',
          description: 'Notification channel created successfully',
        })
      }
      
      setIsDialogOpen(false)
      setIsEditMode(false)
      setEditingChannelId(null)
      setFormData({ name: '', channel_type: 'slack', config: {}, repeat_interval_minutes: 15 })
      loadChannels()
    } catch (error) {
      console.error('Failed to save channel:', error)
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} notification channel`,
        variant: 'destructive',
      })
    }
  }

  const handleEditChannel = (channel: NotificationChannel) => {
    setIsEditMode(true)
    setEditingChannelId(channel.id)
    setFormData({
      name: channel.name,
      channel_type: channel.channel_type,
      config: channel.config,
      repeat_interval_minutes: channel.repeat_interval_minutes || 15,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setChannelToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return
    
    try {
      await apiClient.deleteNotificationChannel(channelToDelete)
      toast({
        title: 'Success',
        description: 'Channel deleted successfully',
      })
      loadChannels()
      setDeleteConfirmOpen(false)
      setChannelToDelete(null)
    } catch (error) {
      console.error('Failed to delete channel:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete channel',
        variant: 'destructive',
      })
    }
  }

  const handleTestChannel = async (channelId: string) => {
    setTestingChannel(channelId)
    try {
      await apiClient.testNotificationChannel(channelId)
      toast({
        title: 'Test Sent! 🎉',
        description: 'Check your notification channel for the test message',
      })
    } catch (error) {
      console.error('Failed to send test:', error)
      toast({
        title: 'Test Failed',
        description: 'Could not send test notification. Please check your configuration.',
        variant: 'destructive',
      })
    } finally {
      setTestingChannel(null)
    }
  }

  const formatConfig = (type: string, config: Record<string, any>) => {
    switch (type) {
      case 'slack':
        return {
          type: 'slack',
          webhook_url: config.webhook_url,
          channel: config.channel || null,
          username: config.username || 'Service Monitor',
          icon_emoji: config.icon_emoji || ':bell:',
        }
      case 'discord':
        return {
          type: 'discord',
          webhook_url: config.webhook_url,
          username: config.username || 'Service Monitor',
          avatar_url: config.avatar_url || null,
        }
      case 'msteams':
        return {
          type: 'msteams',
          webhook_url: config.webhook_url,
        }
      case 'googlechat':
        return {
          type: 'googlechat',
          webhook_url: config.webhook_url,
        }
      case 'email':
        return {
          type: 'email',
          to_addresses: [config.email],
          smtp_server: config.smtp_server || null,
          smtp_port: config.smtp_port ? parseInt(config.smtp_port) : null,
          from_email: config.from_email || null,
        }
      case 'webhook':
        return {
          type: 'webhook',
          url: config.url,
          headers: config.headers ? JSON.parse(config.headers) : null,
          method: config.method || 'POST',
        }
      default:
        return config
    }
  }

  const renderConfigFields = () => {
    const type = formData.channel_type

    switch (type) {
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.config.email || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, email: e.target.value },
                  })
                }
                placeholder="alerts@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recipient email address for alerts
              </p>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">SMTP Configuration (Optional)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Leave blank to use environment defaults
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="smtp_server">SMTP Server</Label>
                  <Input
                    id="smtp_server"
                    value={formData.config.smtp_server || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, smtp_server: e.target.value },
                      })
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={formData.config.smtp_port || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, smtp_port: e.target.value },
                      })
                    }
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={formData.config.from_email || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, from_email: e.target.value },
                      })
                    }
                    placeholder="noreply@monitoring.local"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: SMTP username and password should be set via environment variables
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'slack':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook_url">Webhook URL *</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, webhook_url: e.target.value },
                  })
                }
                placeholder="https://hooks.slack.com/services/..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Create an Incoming Webhook in your Slack app settings
              </p>
            </div>
            <div>
              <Label htmlFor="channel">Channel (Optional)</Label>
              <Input
                id="channel"
                value={formData.config.channel || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, channel: e.target.value },
                  })
                }
                placeholder="#alerts"
              />
            </div>
          </div>
        )

      case 'discord':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook_url">Webhook URL *</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, webhook_url: e.target.value },
                  })
                }
                placeholder="https://discord.com/api/webhooks/..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Server Settings → Integrations → Webhooks → New Webhook
              </p>
            </div>
          </div>
        )

      case 'msteams':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook_url">Webhook URL *</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, webhook_url: e.target.value },
                  })
                }
                placeholder="https://outlook.office.com/webhook/..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Channel → Connectors → Incoming Webhook
              </p>
            </div>
          </div>
        )

      case 'googlechat':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook_url">Webhook URL *</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, webhook_url: e.target.value },
                  })
                }
                placeholder="https://chat.googleapis.com/v1/spaces/..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Space → Apps & integrations → Webhooks
              </p>
            </div>
          </div>
        )

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Webhook URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.config.url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, url: e.target.value },
                  })
                }
                placeholder="https://api.example.com/notifications"
                required
              />
            </div>
            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={formData.config.method || 'POST'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, method: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading notification channels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Channels
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure multi-channel alerts for your monitoring system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Notification Channel</DialogTitle>
              <DialogDescription>
                Choose a platform and configure how you want to receive alerts
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChannel} className="space-y-6">
              <div>
                <Label htmlFor="name">Channel Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Production Alerts"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Platform *</Label>
                <Select
                  value={formData.channel_type}
                  onValueChange={(value: any) => {
                    setFormData({ ...formData, channel_type: value, config: {} })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(channelPlatforms).map(([key, platform]) => {
                      const Icon = platform.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {platform.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {channelPlatforms[formData.channel_type].description}
                </p>
              </div>

              {renderConfigFields()}

              {/* Repeat Interval Configuration */}
              <div className="border-t pt-4">
                <Label htmlFor="repeat-interval">Repeat Alert Interval</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  How often to send repeat notifications while service is DOWN
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: '2 min', value: 2 },
                    { label: '5 min', value: 5 },
                    { label: '15 min', value: 15 },
                    { label: '30 min', value: 30 },
                    { label: '1 hour', value: 60 },
                    { label: '2 hours', value: 120 },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.repeat_interval_minutes === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, repeat_interval_minutes: option.value })}
                      className="w-full"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="custom-interval" className="text-sm whitespace-nowrap">
                    Custom (minutes):
                  </Label>
                  <Input
                    id="custom-interval"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.repeat_interval_minutes || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      repeat_interval_minutes: parseInt(e.target.value) || 15 
                    })}
                    placeholder="15"
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">(1-1440 min)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{isEditMode ? 'Update' : 'Create'} Channel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {channels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <Bell className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notification channels configured</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Set up your first notification channel to receive real-time alerts when services go down
            </p>
            <Button onClick={() => setIsDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Channel Cards */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => {
            const platform = channelPlatforms[channel.channel_type]
            const Icon = platform.icon
            const isTesting = testingChannel === channel.id

            return (
              <Card
                key={channel.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${platform.borderColor}`}
              >
                {/* Gradient Background Header */}
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-br ${platform.color} opacity-10`} />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${platform.bgColor} ${platform.borderColor} border-2`}>
                        <Icon className={`h-6 w-6 ${platform.textColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {platform.name}
                          {channel.is_active && (
                            <Badge variant="default" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(channel.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestChannel(channel.id)}
                      disabled={isTesting}
                      className="flex-1"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Test
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditChannel(channel)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(channel.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info Cards */}
      {channels.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Real-time Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Receive instant notifications when services go down, recover, or experience issues. All channels are monitored 24/7.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Smart Routing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure severity-based routing to send critical alerts to different channels. Set up rules to filter by severity and notification types.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Notification Channel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification channel? This action cannot be undone.
              All configured alerts for this channel will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Channel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
