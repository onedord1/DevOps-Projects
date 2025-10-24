'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    org_name: '',
    org_slug: '',
    org_contact_email: '',
    admin_email: '',
    admin_password: '',
    admin_name: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, isAuthenticated } = useAuth()
  const router = useRouter()

  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await register(formData)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    
    // Auto-generate slug from org name
    if (field === 'org_name') {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, org_slug: slug }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <Activity className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Create Organization</CardTitle>
          <CardDescription className="text-center">
            Register your organization and create an admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-md">{error}</div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="org_name" className="text-sm font-medium">
                    Organization Name
                  </label>
                  <input
                    id="org_name"
                    type="text"
                    value={formData.org_name}
                    onChange={handleChange('org_name')}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Acme Inc"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="org_slug" className="text-sm font-medium">
                    Organization Slug
                  </label>
                  <input
                    id="org_slug"
                    type="text"
                    value={formData.org_slug}
                    onChange={handleChange('org_slug')}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="acme-inc"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="org_contact_email" className="text-sm font-medium">
                  Organization Contact Email
                </label>
                <input
                  id="org_contact_email"
                  type="email"
                  value={formData.org_contact_email}
                  onChange={handleChange('org_contact_email')}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="contact@acme.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin Account</h3>
              <div className="space-y-2">
                <label htmlFor="admin_name" className="text-sm font-medium">
                  Admin Name
                </label>
                <input
                  id="admin_name"
                  type="text"
                  value={formData.admin_name}
                  onChange={handleChange('admin_name')}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="admin_email" className="text-sm font-medium">
                  Admin Email
                </label>
                <input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={handleChange('admin_email')}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin@acme.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="admin_password" className="text-sm font-medium">
                  Admin Password
                </label>
                <input
                  id="admin_password"
                  type="password"
                  value={formData.admin_password}
                  onChange={handleChange('admin_password')}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
