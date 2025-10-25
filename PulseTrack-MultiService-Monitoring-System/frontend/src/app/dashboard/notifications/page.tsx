'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Plus, Trash2, Mail, MessageSquare, Webhook } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotificationChannel {
  id: string
  name: string
  channel_type: 'email' | 'slack' | 'discord' | 'webhook' | 'msteams'
  config: Record<string, any>
  is_active: boolean
  created_at: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    channel_type: 'email' as const,
    config: {} as Record<string, string>,
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
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.createNotificationChannel(formData)
      setIsDialogOpen(false)
      setFormData({ name: '', channel_type: 'email', config: {} })
      loadChannels()
    } catch (error) {
      console.error('Failed to create channel:', error)
    }
  }

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification channel?')) return
    try {
      await apiClient.deleteNotificationChannel(id)
      loadChannels()
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'slack':
      case 'discord':
      case 'ms_teams':
        return <MessageSquare className="h-5 w-5" />
      default:
        return <Webhook className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notification channels...</p>
          </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Channels
          </h1>
          <p className="text-gray-600 mt-1">Manage your notification channels and alerts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Notification Channel</DialogTitle>
              <DialogDescription>
                Add a new channel to receive alerts and notifications
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <Label htmlFor="name">Channel Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Production Alerts"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Channel Type</Label>
                <Select
                  value={formData.channel_type}
                  onValueChange={(value: any) => setFormData({ ...formData, channel_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="msteams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.channel_type === 'email' && (
                <div>
                  <Label htmlFor="email">Email Address</Label>
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
                </div>
              )}
              {['slack', 'discord', 'webhook', 'msteams'].includes(formData.channel_type) && (
                <div>
                  <Label htmlFor="webhook_url">Webhook URL</Label>
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
                    placeholder="https://hooks.slack.com/..."
                    required
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Channel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {channels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notification channels</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by creating your first notification channel
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel.channel_type)}
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {channel.channel_type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="text-gray-600">
                    Created {new Date(channel.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
