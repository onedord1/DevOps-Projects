'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Activity, Building2, Mail, Lock, User, ArrowRight, Hash } from 'lucide-react'

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Professional Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
        }}></div>
      </div>
      
      {/* Animated Geometric Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 border-2 border-blue-500/20 rounded-lg rotate-45 animate-float"></div>
      <div className="absolute top-40 right-20 w-24 h-24 border-2 border-cyan-500/20 rounded-full animate-float animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 border-2 border-indigo-500/20 rotate-12 animate-float animation-delay-4000"></div>
      <div className="absolute bottom-40 right-1/3 w-16 h-16 border-2 border-blue-400/20 rounded-lg animate-spin-slow"></div>

      {/* Professional Card */}
      <div className="relative z-10 w-full max-w-3xl">
        <div className="backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-10 transform hover:shadow-blue-500/10 hover:shadow-3xl transition-all duration-500">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-xl">
                <Activity className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Join PulseTrack
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-center font-medium">Register your organization and create an admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl animate-shake">
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Organization Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Organization Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="org_name" className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Organization Name
                  </label>
                  <input
                    id="org_name"
                    type="text"
                    value={formData.org_name}
                    onChange={handleChange('org_name')}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                    placeholder="Acme Inc"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="org_slug" className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-600" />
                    Organization Slug
                  </label>
                  <input
                    id="org_slug"
                    type="text"
                    value={formData.org_slug}
                    onChange={handleChange('org_slug')}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                    placeholder="acme-inc"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="org_contact_email" className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Organization Contact Email
                </label>
                <input
                  id="org_contact_email"
                  type="email"
                  value={formData.org_contact_email}
                  onChange={handleChange('org_contact_email')}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="contact@acme.com"
                />
              </div>
            </div>

            {/* Admin Account Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Admin Account</h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="admin_name" className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Admin Name
                </label>
                <input
                  id="admin_name"
                  type="text"
                  value={formData.admin_name}
                  onChange={handleChange('admin_name')}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="admin_email" className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Admin Email
                </label>
                <input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={handleChange('admin_email')}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="admin@acme.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="admin_password" className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Admin Password
                </label>
                <input
                  id="admin_password"
                  type="password"
                  value={formData.admin_password}
                  onChange={handleChange('admin_password')}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="••••••••••"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Minimum 8 characters required</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:translate-y-[-2px] active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Organization...</span>
                </>
              ) : (
                <>
                  <span>Create Organization</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                Sign in now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
