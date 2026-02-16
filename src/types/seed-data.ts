import { Connector, ConnectorTool } from './connector';

// Seed data for connectors
export const SEED_CONNECTORS: Connector[] = [
  {
    id: 'conn-google-gmail',
    name: 'Google Gmail',
    slug: 'google-gmail',
    description: 'Send emails, read inbox, manage labels and drafts via Gmail API.',
    category: 'Communication',
    iconUrl: '/connectors/gmail.svg',
    authType: 'oauth',
    oauthProvider: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
      userinfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-google-drive',
    name: 'Google Drive',
    slug: 'google-drive',
    description: 'Access files, upload documents, and manage shared drives.',
    category: 'Storage',
    iconUrl: '/connectors/drive.svg',
    authType: 'oauth',
    oauthProvider: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-notion',
    name: 'Notion',
    slug: 'notion',
    description: 'Create pages, query databases, and manage workspace content.',
    category: 'Productivity',
    iconUrl: '/connectors/notion.svg',
    authType: 'oauth',
    oauthProvider: 'notion',
    oauthScopes: [],
    oauthConfig: {
      authUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-github',
    name: 'GitHub',
    slug: 'github',
    description: 'Manage repositories, issues, pull requests, and actions.',
    category: 'Development',
    iconUrl: '/connectors/github.svg',
    authType: 'oauth',
    oauthProvider: 'github',
    oauthScopes: ['repo', 'read:user', 'read:org'],
    oauthConfig: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-slack',
    name: 'Slack',
    slug: 'slack',
    description: 'Send messages, manage channels, and access workspace data.',
    category: 'Communication',
    iconUrl: '/connectors/slack.svg',
    authType: 'oauth',
    oauthProvider: 'slack',
    oauthScopes: ['channels:read', 'chat:write', 'users:read'],
    oauthConfig: {
      authUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      revokeUrl: 'https://slack.com/api/auth.revoke',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-airtable',
    name: 'Airtable',
    slug: 'airtable',
    description: 'Query bases, create records, and manage views.',
    category: 'Database',
    iconUrl: '/connectors/airtable.svg',
    authType: 'oauth',
    oauthProvider: 'airtable',
    oauthScopes: ['data.records:read', 'data.records:write', 'schema.bases:read'],
    oauthConfig: {
      authUrl: 'https://airtable.com/oauth2/v1/authorize',
      tokenUrl: 'https://airtable.com/oauth2/v1/token',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-vercel',
    name: 'Vercel',
    slug: 'vercel',
    description: 'Deploy projects, manage domains, and view deployment logs.',
    category: 'Development',
    iconUrl: '/connectors/vercel.svg',
    authType: 'oauth',
    oauthProvider: 'vercel',
    oauthScopes: [],
    oauthConfig: {
      authUrl: 'https://vercel.com/oauth/authorize',
      tokenUrl: 'https://api.vercel.com/v2/oauth/access_token',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'conn-custom-mcp',
    name: 'Custom MCP Server',
    slug: 'custom-mcp',
    description: 'Connect to any MCP-compatible server for tool discovery and execution.',
    category: 'Custom',
    iconUrl: '/connectors/mcp.svg',
    authType: 'api_key',
    mcpServerUrl: '', // User provides this
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Sample tools for each connector
export const SEED_TOOLS: ConnectorTool[] = [
  // Gmail tools
  {
    id: 'tool-gmail-send',
    connectorId: 'conn-google-gmail',
    name: 'send_email',
    description: 'Send an email to specified recipients',
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body content (HTML supported)' },
        cc: { type: 'string', description: 'CC recipients (comma-separated)' },
      },
      required: ['to', 'subject', 'body'],
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tool-gmail-list',
    connectorId: 'conn-google-gmail',
    name: 'list_messages',
    description: 'List recent emails from inbox',
    schema: {
      type: 'object',
      properties: {
        maxResults: { type: 'number', description: 'Maximum number of messages to return', default: 10 },
        query: { type: 'string', description: 'Gmail search query' },
        labelIds: { type: 'array', description: 'Filter by label IDs', items: { type: 'string' } },
      },
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  // GitHub tools
  {
    id: 'tool-github-repos',
    connectorId: 'conn-github',
    name: 'list_repositories',
    description: 'List repositories for the authenticated user',
    schema: {
      type: 'object',
      properties: {
        visibility: { type: 'string', enum: ['all', 'public', 'private'], default: 'all' },
        sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], default: 'updated' },
        per_page: { type: 'number', description: 'Results per page', default: 30 },
      },
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tool-github-issues',
    connectorId: 'conn-github',
    name: 'create_issue',
    description: 'Create a new issue in a repository',
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body content' },
        labels: { type: 'array', description: 'Labels to add', items: { type: 'string' } },
      },
      required: ['owner', 'repo', 'title'],
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  // Notion tools
  {
    id: 'tool-notion-search',
    connectorId: 'conn-notion',
    name: 'search',
    description: 'Search across all pages and databases',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        filter: { type: 'object', description: 'Filter by object type' },
        page_size: { type: 'number', description: 'Number of results', default: 10 },
      },
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tool-notion-create-page',
    connectorId: 'conn-notion',
    name: 'create_page',
    description: 'Create a new page in a database or as a child of another page',
    schema: {
      type: 'object',
      properties: {
        parent_id: { type: 'string', description: 'Parent page or database ID' },
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Page content in markdown' },
      },
      required: ['parent_id', 'title'],
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  // Slack tools
  {
    id: 'tool-slack-send',
    connectorId: 'conn-slack',
    name: 'send_message',
    description: 'Send a message to a channel or user',
    schema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel ID or user ID' },
        text: { type: 'string', description: 'Message text' },
        thread_ts: { type: 'string', description: 'Thread timestamp for replies' },
      },
      required: ['channel', 'text'],
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  // Airtable tools
  {
    id: 'tool-airtable-list',
    connectorId: 'conn-airtable',
    name: 'list_records',
    description: 'List records from a table',
    schema: {
      type: 'object',
      properties: {
        base_id: { type: 'string', description: 'Airtable base ID' },
        table_name: { type: 'string', description: 'Table name or ID' },
        max_records: { type: 'number', description: 'Maximum records to return', default: 100 },
        view: { type: 'string', description: 'View name or ID' },
      },
      required: ['base_id', 'table_name'],
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  // Vercel tools
  {
    id: 'tool-vercel-deploy',
    connectorId: 'conn-vercel',
    name: 'list_deployments',
    description: 'List recent deployments',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID or name' },
        limit: { type: 'number', description: 'Number of deployments to return', default: 20 },
        state: { type: 'string', enum: ['BUILDING', 'ERROR', 'INITIALIZING', 'QUEUED', 'READY', 'CANCELED'] },
      },
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
  // Google Drive tools
  {
    id: 'tool-drive-list',
    connectorId: 'conn-google-drive',
    name: 'list_files',
    description: 'List files in Google Drive',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        pageSize: { type: 'number', description: 'Number of files to return', default: 10 },
        folderId: { type: 'string', description: 'Parent folder ID' },
      },
    },
    source: 'rest',
    createdAt: new Date().toISOString(),
  },
];

// Category metadata
export const CONNECTOR_CATEGORIES = [
  { slug: 'all', name: 'All Connectors', icon: 'Grid3X3' },
  { slug: 'communication', name: 'Communication', icon: 'MessageSquare' },
  { slug: 'productivity', name: 'Productivity', icon: 'Zap' },
  { slug: 'development', name: 'Development', icon: 'Code2' },
  { slug: 'storage', name: 'Storage', icon: 'HardDrive' },
  { slug: 'database', name: 'Database', icon: 'Database' },
  { slug: 'custom', name: 'Custom', icon: 'Puzzle' },
  { slug: 'mcp', name: 'MCP', icon: 'Server' },
];
