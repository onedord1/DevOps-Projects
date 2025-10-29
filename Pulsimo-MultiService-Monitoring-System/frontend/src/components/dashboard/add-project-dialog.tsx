'use client'

import { useState } from 'react'
import { X, FolderKanban, Sparkles, Flag, Mail, Tag, Palette, Zap } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import type { ProjectPriority } from '@/types'

interface AddProjectDialogProps {
  open: boolean
  onClose: () => void
  onProjectCreated: () => void
}

export function AddProjectDialog({ open, onClose, onProjectCreated }: AddProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    priority: 'medium' as ProjectPriority,
    tags: '',
    owner_email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      await apiClient.createProject({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        color: formData.color,
        priority: formData.priority,
        tags: tags.length > 0 ? tags : undefined,
        owner_email: formData.owner_email || undefined,
      })

      onProjectCreated()
      resetForm()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
      priority: 'medium',
      tags: '',
      owner_email: '',
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const priorityColors = {
    low: '#10b981',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 transform animate-in zoom-in-95 duration-300">
        {/* Modern Gradient Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Create New Project
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                </h2>
                <p className="text-purple-100 text-sm font-medium">
                  Organize your service endpoints by project
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form with scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
                <Zap className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-violet-600" />
                  Project Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                  placeholder="E-commerce Platform"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-600" />
                  Slug *
                </label>
                <input
                  id="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  pattern="[a-z0-9\-]+"
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all font-mono text-sm"
                  placeholder="e-commerce-platform"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the project..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-violet-600" />
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as ProjectPriority })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all font-semibold"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🔵 Medium Priority</option>
                  <option value="high">🟡 High Priority</option>
                  <option value="critical">🔴 Critical Priority</option>
                </select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-600" />
                  Project Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-12 w-16 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {Object.entries(priorityColors).map(([key, color]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-xl border-2 hover:scale-110 transition-all shadow-md ${
                        formData.color === color 
                          ? 'border-violet-500 ring-2 ring-violet-300' 
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      style={{ backgroundColor: color }}
                      title={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Tag className="h-4 w-4 text-violet-600" />
                Tags
              </label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="production, critical, backend (comma-separated)"
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Owner Email */}
            <div className="space-y-2">
              <label htmlFor="owner_email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-600" />
                Owner Email
              </label>
              <input
                id="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                placeholder="owner@example.com"
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t-2 border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
