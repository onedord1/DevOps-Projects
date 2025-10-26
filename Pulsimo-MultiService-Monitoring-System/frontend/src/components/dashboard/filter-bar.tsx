'use client'

import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EndpointStatus, ServiceType } from '@/types'

interface FilterBarProps {
  filters: {
    status?: EndpointStatus
    serviceType?: ServiceType
    search?: string
  }
  onFiltersChange: (filters: any) => void
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search services..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={filters.status || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: e.target.value || undefined,
            })
          }
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="UP">Up</option>
          <option value="PARTIAL_OUTAGE">Partial Outage</option>
          <option value="DOWN">Down</option>
          <option value="UNKNOWN">Unknown</option>
        </select>

        <select
          value={filters.serviceType || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              serviceType: e.target.value || undefined,
            })
          }
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="microservice">Microservice</option>
          <option value="database">Database</option>
          <option value="api">API</option>
          <option value="other">Other</option>
        </select>

        {(filters.status || filters.serviceType || filters.search) && (
          <Button
            variant="outline"
            onClick={() => onFiltersChange({})}
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}
