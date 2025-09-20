// Configuration file for the expense tracker app
// Update the API_URL with your backend endpoint (running on port 8080)
export const config = {
  // Backend API configuration
  API_URL: 'http://localhost:7070/api', // Replace with your actual backend URL
  
  // App configuration
  APP_NAME: 'ExpenseTracker',
  VERSION: '1.0.0',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Currency options
  DEFAULT_CURRENCY: 'USD',
  SUPPORTED_CURRENCIES: [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ],
  
  // Theme configuration
  DEFAULT_THEME: 'light',
  
  // Date formats
  DATE_FORMAT: 'YYYY-MM-DD',
  DISPLAY_DATE_FORMAT: 'MMM DD, YYYY',
  
  // Chart colors
  CHART_COLORS: [
    '#3B82F6', // Blue
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F59E0B', // Amber
  ],
} as const;

export type Currency = typeof config.SUPPORTED_CURRENCIES[0];
export type Theme = 'light' | 'dark';