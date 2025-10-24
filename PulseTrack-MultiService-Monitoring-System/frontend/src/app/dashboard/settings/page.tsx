'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, Building2, Key, Shield, Bell, Copy, Plus, Trash2, 
  Save, CheckCircle2, AlertCircle, Users, Eye, Lock, Crown
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { User } from '@/types'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization')
  const [saved, setSaved] = useState(false)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState<string>('')
  const [error, setError] = useState('')

  // Organization settings state
  const [orgSettings, setOrgSettings] = useState({
    name: '',
    contact_email: '',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
  })

  // Load organization settings on mount
  useEffect(() => {
    loadOrganization()
  }, [])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers()
    } else if (activeTab === 'apikeys') {
      loadApiKeys()
    }
  }, [activeTab])

  const loadOrganization = async () => {
    try {
      const response = await apiClient.getOrganizations()
      if (response.data && response.data.length > 0) {
        const org = response.data[0]
        setOrgId(org.id)
        setOrgSettings({
          name: org.name,
          contact_email: org.contact_email,
          timezone: org.timezone || 'UTC',
          date_format: org.date_format || 'YYYY-MM-DD',
        })
      }
    } catch (error) {
      console.error('Failed to load organization:', error)
      setError('Failed to load organization settings')
    }
  }

  const loadApiKeys = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getApiKeys()
      setApiKeys(response.data || [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getUsers()
      setMembers(response.data || [])
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOrganization = async () => {
    if (!orgId) return
    
    setLoading(true)
    setError('')
    try {
      await apiClient.updateOrganization(orgId, orgSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Failed to save organization:', error)
      setError(error.response?.data?.error || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    setLoading(true)
    try {
      const response = await apiClient.createApiKey(`API Key ${apiKeys.length + 1}`)
      if (response.data) {
        // Show the key once
        alert(`New API Key Created!\n\nKey: ${response.data.key}\n\nIMPORTANT: Copy this key now. You won't be able to see it again!`)
        await loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
      setError('Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    try {
      await apiClient.deleteApiKey(id)
      await loadApiKeys()
    } catch (error) {
      console.error('Failed to delete API key:', error)
      setError('Failed to delete API key')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const updateMemberRole = async (userId: string, role: 'admin' | 'member' | 'viewer') => {
    try {
      await apiClient.updateUser(userId, { role })
      loadMembers()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'member':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'member':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
      case 'viewer':
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your organization, API keys, and permissions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organization</span>
            </TabsTrigger>
            <TabsTrigger value="apikeys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Members & Permissions</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Details
                </CardTitle>
                <CardDescription>Manage your organization information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={orgSettings.name}
                      onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Contact Email</Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={orgSettings.contact_email}
                      onChange={(e) => setOrgSettings({ ...orgSettings, contact_email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={orgSettings.timezone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <select
                      id="date-format"
                      value={orgSettings.date_format}
                      onChange={(e) => setOrgSettings({ ...orgSettings, date_format: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={handleSaveOrganization} disabled={loading} className="flex items-center gap-2">
                    {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                  {saved && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Settings saved successfully
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Keys
                    </CardTitle>
                    <CardDescription>Manage API keys for programmatic access</CardDescription>
                  </div>
                  <Button onClick={generateApiKey} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Generate New Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No API keys yet</p>
                    <Button onClick={generateApiKey} variant="outline">
                      Generate Your First API Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div
                        key={apiKey.id}
                        className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{apiKey.name}</p>
                            <Badge variant="outline">{apiKey.is_active ? 'Active' : 'Inactive'}</Badge>
                          </div>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all">
                            {apiKey.key_prefix}••••••••••••••••
                          </code>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(apiKey.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members & Permissions Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Members & Role-Based Access Control
                </CardTitle>
                <CardDescription>
                  Manage member permissions: Admin (full access), Member (manage services), Viewer (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Role Legend */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border-2 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold">Admin</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Full access to all features including organization settings, user management, and billing
                    </p>
                  </div>
                  <div className="border-2 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold">Member</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Can create, edit, and delete monitoring endpoints and notification channels
                    </p>
                  </div>
                  <div className="border-2 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold">Viewer</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Read-only access to view dashboards, endpoints, and health check data
                    </p>
                  </div>
                </div>

                {/* Members List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          </div>
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value as any)}
                            className="border-2 rounded-md px-3 py-1.5 text-sm font-medium hover:border-primary transition-colors"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                    <div>
                      <p className="font-semibold">Endpoint Down Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive alerts when endpoints go down</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                    <div>
                      <p className="font-semibold">Recovery Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified when services recover</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                    <div>
                      <p className="font-semibold">Weekly Health Reports</p>
                      <p className="text-sm text-muted-foreground">Receive weekly summary of system health</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                    <div>
                      <p className="font-semibold">Maintenance Reminders</p>
                      <p className="text-sm text-muted-foreground">Reminders for scheduled maintenance</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                </div>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
