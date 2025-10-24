'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Endpoint, ServiceType } from '@/types'

interface EditEndpointDialogProps {
  endpoint: Endpoint
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditEndpointDialog({ endpoint, open, onOpenChange, onSuccess }: EditEndpointDialogProps) {
  const [formData, setFormData] = useState({
    name: endpoint.name,
    url: endpoint.url,
    service_type: endpoint.service_type as ServiceType,
    description: endpoint.description || '',
    tags: endpoint.tags ? endpoint.tags.join(', ') : '',
    owner_contact: endpoint.owner_contact || '',
    check_interval_seconds: endpoint.check_interval_seconds || 60,
    timeout_seconds: endpoint.timeout_seconds || 30,
    expected_status_code: endpoint.expected_status_code || 200,
    failure_threshold_minutes: endpoint.failure_threshold_minutes || 5,
    retry_count: endpoint.retry_count || 3,
    retry_delay_seconds: endpoint.retry_delay_seconds || 5,
    auth_header: endpoint.auth_header || '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Update form when endpoint changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: endpoint.name,
        url: endpoint.url,
        service_type: endpoint.service_type as ServiceType,
        description: endpoint.description || '',
        tags: endpoint.tags ? endpoint.tags.join(', ') : '',
        owner_contact: endpoint.owner_contact || '',
        check_interval_seconds: endpoint.check_interval_seconds || 60,
        timeout_seconds: endpoint.timeout_seconds || 30,
        expected_status_code: endpoint.expected_status_code || 200,
        failure_threshold_minutes: endpoint.failure_threshold_minutes || 5,
        retry_count: endpoint.retry_count || 3,
        retry_delay_seconds: endpoint.retry_delay_seconds || 5,
        auth_header: endpoint.auth_header || '',
      })
      setError('')
    }
  }, [endpoint, open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        auth_header: formData.auth_header || undefined,
      }

      const response = await apiClient.updateEndpoint(endpoint.id, payload)
      
      if (response.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        setError(response.error || 'Failed to update endpoint')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update endpoint')
    } finally {
      setIsLoading(false)
    }
  }

  const requiresAuth = formData.service_type !== 'frontend'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Service Endpoint</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My API Service"
                required
              />
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-service-type">
                Service Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit-service-type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="microservice">Microservice</option>
                <option value="database">Database</option>
                <option value="api">API</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="edit-url">
              Service URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.example.com/health"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your service endpoint..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Check Interval */}
            <div className="space-y-2">
              <Label htmlFor="edit-check-interval">Check Interval (seconds)</Label>
              <Input
                id="edit-check-interval"
                type="number"
                min="10"
                max="3600"
                value={formData.check_interval_seconds}
                onChange={(e) => setFormData({ ...formData, check_interval_seconds: parseInt(e.target.value) })}
              />
            </div>

            {/* Timeout */}
            <div className="space-y-2">
              <Label htmlFor="edit-timeout">Timeout (seconds)</Label>
              <Input
                id="edit-timeout"
                type="number"
                min="1"
                max="300"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="production, critical, api"
            />
          </div>

          {/* Auth Header (conditional) */}
          {requiresAuth && (
            <div className="space-y-2">
              <Label htmlFor="edit-auth-header">Authentication Header (Optional)</Label>
              <Input
                id="edit-auth-header"
                value={formData.auth_header}
                onChange={(e) => setFormData({ ...formData, auth_header: e.target.value })}
                placeholder="Bearer token123 or Basic user:pass"
                type="password"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                For protected endpoints requiring authentication
              </p>
            </div>
          )}

          {/* Owner Contact */}
          <div className="space-y-2">
            <Label htmlFor="edit-owner-contact">Owner Email</Label>
            <Input
              id="edit-owner-contact"
              type="email"
              value={formData.owner_contact}
              onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
              placeholder="owner@example.com"
            />
          </div>

          {/* Advanced Settings */}
          <details className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <summary className="cursor-pointer p-4 font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
              Advanced Settings
            </summary>
            <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expected-status">Expected Status Code</Label>
                  <Input
                    id="edit-expected-status"
                    type="number"
                    value={formData.expected_status_code}
                    onChange={(e) => setFormData({ ...formData, expected_status_code: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-failure-threshold">Failure Threshold (min)</Label>
                  <Input
                    id="edit-failure-threshold"
                    type="number"
                    value={formData.failure_threshold_minutes}
                    onChange={(e) => setFormData({ ...formData, failure_threshold_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-retry-count">Retry Count</Label>
                  <Input
                    id="edit-retry-count"
                    type="number"
                    value={formData.retry_count}
                    onChange={(e) => setFormData({ ...formData, retry_count: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-retry-delay">Retry Delay (sec)</Label>
                  <Input
                    id="edit-retry-delay"
                    type="number"
                    value={formData.retry_delay_seconds}
                    onChange={(e) => setFormData({ ...formData, retry_delay_seconds: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Service'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
