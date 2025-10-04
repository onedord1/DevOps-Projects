export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/login',
    REGISTER: '/api/v1/register',
  },
  DASHBOARD: '/api/v1/dashboard',
  MONITORS: {
    BASE: '/api/v1/monitors',
    BY_ID: (id: string) => `/api/v1/monitors/${id}`,
  },
  METRICS: {
    RAW: '/api/v1/metrics/raw',
    AGGREGATE: '/api/v1/metrics/aggregate',
  },
  ALERT_RULES: {
    BASE: '/api/v1/alert-rules',
    BY_ID: (id: string) => `/api/v1/alert-rules/${id}`,
  },
  ALERTS: {
    ACTIVE: '/api/v1/alerts/active',
    ACKNOWLEDGE: (id: string) => `/api/v1/alerts/${id}/acknowledge`,
  },
  INCIDENTS: {
    BASE: '/api/v1/incidents',
    BY_ID: (id: string) => `/api/v1/incidents/${id}`,
    TIMELINE: (id: string) => `/api/v1/incidents/${id}/timeline`,
    COMMENT: (id: string) => `/api/v1/incidents/${id}/comment`,
    RESOLVE: (id: string) => `/api/v1/incidents/${id}/resolve`,
  },
  CHANNELS: {
    BASE: '/api/v1/channels',
    BY_ID: (id: string) => `/api/v1/channels/${id}`,
  },
  HEALTH: '/api/v1/health',
} as const;

export const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;
export type Environment = typeof ENVIRONMENTS[number];
