// Core types for MCP Connector Hub

export type AuthType = 'oauth' | 'api_key' | 'none';
export type ToolSource = 'mcp' | 'rest';
export type ConnectionStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'error';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type EventLevel = 'info' | 'warn' | 'error';
export type OAuthTransactionStatus = 'started' | 'completed' | 'failed';

// Connector - metadata describing a service integration
export interface Connector {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  iconUrl: string;
  authType: AuthType;
  oauthProvider?: string;
  oauthScopes?: string[];
  oauthConfig?: OAuthConfig;
  mcpServerUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  userinfoUrl?: string;
  clientId?: string;
  // clientSecret stored in secrets, not exposed
}

// Connector Tool - callable operation
export interface ConnectorTool {
  id: string;
  connectorId: string;
  name: string;
  description: string;
  schema: ToolSchema;
  source: ToolSource;
  createdAt: string;
}

export interface ToolSchema {
  type: 'object';
  properties: Record<string, ToolSchemaProperty>;
  required?: string[];
}

export interface ToolSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: ToolSchemaProperty;
}

// User Connection - user-specific instance containing auth
export interface UserConnection {
  id: string;
  userId: string;
  connectorId: string;
  status: ConnectionStatus;
  secretRefAccess?: string;
  secretRefRefresh?: string;
  expiresAt?: string;
  scopes?: string[];
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// OAuth Transaction - for idempotent OAuth flow
export interface OAuthTransaction {
  id: string;
  userId: string;
  connectorId: string;
  state: string;
  codeVerifierHash: string;
  redirectUri: string;
  status: OAuthTransactionStatus;
  createdAt: string;
  completedAt?: string;
}

// Pipeline Job - background/long-running execution unit
export interface PipelineJob {
  id: string;
  userId: string;
  connectorId: string;
  toolName: string;
  type: string;
  status: JobStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

// Pipeline Event - emitted by jobs
export interface PipelineEvent {
  id: string;
  jobId: string;
  ts: string;
  level: EventLevel;
  message: string;
  data?: Record<string, unknown>;
}

// Action Log - audit trail
export interface ActionLog {
  id: string;
  userId: string;
  connectorId: string;
  toolName: string;
  request: Record<string, unknown>;
  response?: Record<string, unknown>;
  status: 'success' | 'error';
  error?: string;
  latencyMs: number;
  createdAt: string;
}

// UI-specific types
export interface ConnectorWithConnection extends Connector {
  connection?: UserConnection;
  tools?: ConnectorTool[];
}

export interface ToolExecutionRequest {
  connectorSlug: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolExecutionResult {
  success: boolean;
  jobId: string;
  result?: unknown;
  error?: string;
  events: PipelineEvent[];
}

// Rate limiting
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitState {
  count: number;
  resetAt: number;
}

// Circuit breaker for connector resilience
export interface CircuitBreakerState {
  failures: number;
  lastFailure?: number;
  isOpen: boolean;
  openedAt?: number;
}
