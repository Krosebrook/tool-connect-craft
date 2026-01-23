/**
 * Configuration module for environment variables and app settings.
 * All environment variables should be accessed through this module.
 */

// Environment variable validation
function getEnvVar(key: string, required: boolean = true): string {
  const value = import.meta.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
}

// Supabase configuration
export const supabaseConfig = {
  url: getEnvVar('VITE_SUPABASE_URL'),
  publishableKey: getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
  projectId: getEnvVar('VITE_SUPABASE_PROJECT_ID'),
} as const;

// Application configuration
export const appConfig = {
  // App metadata
  name: 'Tool Connect Craft',
  version: '0.1.0',
  description: 'Model Context Protocol Connector Hub',
  
  // Development settings
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Server configuration
  serverPort: 8080,
  serverHost: '::',
  
  // Feature flags
  features: {
    enableOAuth: false, // Set to true when OAuth is implemented
    enableMCP: false,   // Set to true when MCP is implemented
    enableRealtime: true,
    enableAuditLogs: true,
  },
  
  // UI configuration
  ui: {
    itemsPerPage: 30,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    toastDuration: 5000, // ms
  },
  
  // API configuration
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },
  
  // Job configuration
  jobs: {
    maxConcurrent: 5,
    defaultTimeout: 300000, // 5 minutes
    pollInterval: 1000, // 1 second for simulated jobs
  },
} as const;

// Connector categories
export const CONNECTOR_CATEGORIES = [
  { slug: 'all', name: 'All Connectors', icon: 'Grid3X3' },
  { slug: 'communication', name: 'Communication', icon: 'MessageSquare' },
  { slug: 'productivity', name: 'Productivity', icon: 'Zap' },
  { slug: 'development', name: 'Development', icon: 'Code2' },
  { slug: 'storage', name: 'Storage', icon: 'HardDrive' },
  { slug: 'database', name: 'Database', icon: 'Database' },
  { slug: 'custom', name: 'Custom', icon: 'Puzzle' },
] as const;

// Connection status labels
export const CONNECTION_STATUS_LABELS = {
  pending: 'Pending',
  active: 'Active',
  expired: 'Expired',
  revoked: 'Revoked',
  error: 'Error',
} as const;

// Job status labels
export const JOB_STATUS_LABELS = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  canceled: 'Canceled',
} as const;

// Event level labels
export const EVENT_LEVEL_LABELS = {
  info: 'Info',
  warn: 'Warning',
  error: 'Error',
} as const;

// Route paths
export const ROUTES = {
  home: '/',
  connectors: '/connectors',
  connectorDetail: (slug: string) => `/connectors/${slug}`,
  dashboard: '/dashboard',
  securitySettings: '/settings/security',
} as const;

// Validate configuration on module load
if (appConfig.isProduction) {
  // Ensure critical environment variables are set
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error('Critical configuration missing for production');
  }
}

export default appConfig;
