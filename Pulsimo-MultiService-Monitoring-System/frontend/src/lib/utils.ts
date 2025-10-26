import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EndpointStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: EndpointStatus): string {
  switch (status) {
    case 'UP':
      return 'border-green-500 bg-green-50 dark:bg-green-950'
    case 'PARTIAL_OUTAGE':
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
    case 'DOWN':
      return 'border-red-500 bg-red-50 dark:bg-red-950'
    case 'UNKNOWN':
    default:
      return 'border-gray-500 bg-gray-50 dark:bg-gray-950'
  }
}

export function getStatusBadgeColor(status: EndpointStatus): string {
  switch (status) {
    case 'UP':
      return 'bg-green-500 text-white'
    case 'PARTIAL_OUTAGE':
      return 'bg-yellow-500 text-white'
    case 'DOWN':
      return 'bg-red-500 text-white'
    case 'UNKNOWN':
    default:
      return 'bg-gray-500 text-white'
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  } else {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString()
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) {
    return 'just now'
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else {
    const days = Math.floor(seconds / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }
}

export function calculateUptimePercentage(totalChecks: number, successfulChecks: number): number {
  if (totalChecks === 0) return 0
  return (successfulChecks / totalChecks) * 100
}
