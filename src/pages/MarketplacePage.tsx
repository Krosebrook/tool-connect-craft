import { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConnectorIcon } from '@/components/connectors/ConnectorIcon';
import { useConnectors } from '@/context/ConnectorContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Check, 
  Star, 
  Users, 
  ArrowRight,
  Sparkles,
  Filter,
  Eye,
  Zap,
  TrendingUp,
} from 'lucide-react';

export interface MarketplaceConnector {
  slug: string;
  name: string;
  description: string;
  category: string;
  authType: 'oauth' | 'api_key' | 'none';
  oauthProvider?: string;
  oauthScopes?: string[];
  oauthConfig?: Record<string, string>;
  tags: string[];
  popularity: number; // 1-5
  toolCount: number;
  isNew?: boolean;
  tools: { name: string; description: string; schema: Record<string, unknown> }[];
}

export const MARKETPLACE_CONNECTORS: MarketplaceConnector[] = [
  {
    slug: 'slack',
    name: 'Slack',
    description: 'Send messages, manage channels, read conversations, and automate workspace workflows.',
    category: 'Communication',
    authType: 'oauth',
    oauthProvider: 'slack',
    oauthScopes: ['channels:read', 'chat:write', 'users:read'],
    oauthConfig: {
      authUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      revokeUrl: 'https://slack.com/api/auth.revoke',
    },
    tags: ['messaging', 'team', 'notifications'],
    popularity: 5,
    toolCount: 4,
    tools: [
      { name: 'send_message', description: 'Send a message to a channel or user', schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID or user ID' }, text: { type: 'string', description: 'Message text' }, thread_ts: { type: 'string', description: 'Thread timestamp for replies' } }, required: ['channel', 'text'] } },
      { name: 'list_channels', description: 'List all channels in the workspace', schema: { type: 'object', properties: { limit: { type: 'number', description: 'Max channels to return', default: 100 } } } },
      { name: 'get_user_info', description: 'Get information about a user', schema: { type: 'object', properties: { user: { type: 'string', description: 'User ID' } }, required: ['user'] } },
      { name: 'set_status', description: 'Set your Slack status', schema: { type: 'object', properties: { status_text: { type: 'string' }, status_emoji: { type: 'string' } }, required: ['status_text'] } },
    ],
  },
  {
    slug: 'github',
    name: 'GitHub',
    description: 'Manage repositories, issues, pull requests, actions, and automate your development workflow.',
    category: 'Development',
    authType: 'oauth',
    oauthProvider: 'github',
    oauthScopes: ['repo', 'read:user', 'read:org'],
    oauthConfig: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
    },
    tags: ['git', 'code', 'ci/cd', 'issues'],
    popularity: 5,
    toolCount: 5,
    tools: [
      { name: 'list_repositories', description: 'List repositories for the authenticated user', schema: { type: 'object', properties: { visibility: { type: 'string', enum: ['all', 'public', 'private'], default: 'all' }, sort: { type: 'string', enum: ['created', 'updated', 'pushed'], default: 'updated' } } } },
      { name: 'create_issue', description: 'Create a new issue in a repository', schema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] } },
      { name: 'list_pull_requests', description: 'List pull requests for a repository', schema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] } }, required: ['owner', 'repo'] } },
      { name: 'get_file_contents', description: 'Get contents of a file from a repository', schema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' } }, required: ['owner', 'repo', 'path'] } },
      { name: 'create_pull_request', description: 'Create a pull request', schema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, head: { type: 'string' }, base: { type: 'string' } }, required: ['owner', 'repo', 'title', 'head', 'base'] } },
    ],
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    description: 'Manage contacts, deals, companies, and automate your CRM workflows.',
    category: 'CRM',
    authType: 'api_key',
    tags: ['crm', 'sales', 'marketing', 'contacts'],
    popularity: 4,
    toolCount: 5,
    tools: [
      { name: 'list_contacts', description: 'List contacts from CRM', schema: { type: 'object', properties: { limit: { type: 'number', default: 10 }, after: { type: 'string' } } } },
      { name: 'create_contact', description: 'Create a new contact', schema: { type: 'object', properties: { email: { type: 'string' }, firstname: { type: 'string' }, lastname: { type: 'string' }, phone: { type: 'string' } }, required: ['email'] } },
      { name: 'list_deals', description: 'List deals from the pipeline', schema: { type: 'object', properties: { limit: { type: 'number', default: 10 }, stage: { type: 'string' } } } },
      { name: 'create_deal', description: 'Create a new deal', schema: { type: 'object', properties: { dealname: { type: 'string' }, amount: { type: 'number' }, pipeline: { type: 'string' } }, required: ['dealname'] } },
      { name: 'search_contacts', description: 'Search contacts by query', schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    ],
  },
  {
    slug: 'notion',
    name: 'Notion',
    description: 'Create pages, query databases, manage workspace content, and organize knowledge.',
    category: 'Productivity',
    authType: 'oauth',
    oauthProvider: 'notion',
    oauthScopes: [],
    oauthConfig: {
      authUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
    },
    tags: ['wiki', 'docs', 'database', 'notes'],
    popularity: 5,
    toolCount: 4,
    tools: [
      { name: 'search', description: 'Search across all pages and databases', schema: { type: 'object', properties: { query: { type: 'string' }, page_size: { type: 'number', default: 10 } } } },
      { name: 'create_page', description: 'Create a new page', schema: { type: 'object', properties: { parent_id: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' } }, required: ['parent_id', 'title'] } },
      { name: 'query_database', description: 'Query a Notion database', schema: { type: 'object', properties: { database_id: { type: 'string' }, filter: { type: 'object' } }, required: ['database_id'] } },
      { name: 'update_page', description: 'Update an existing page', schema: { type: 'object', properties: { page_id: { type: 'string' }, properties: { type: 'object' } }, required: ['page_id'] } },
    ],
  },
  {
    slug: 'google-gmail',
    name: 'Google Gmail',
    description: 'Send emails, read inbox, manage labels, drafts, and automate email workflows.',
    category: 'Communication',
    authType: 'oauth',
    oauthProvider: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
    },
    tags: ['email', 'google', 'communication'],
    popularity: 5,
    toolCount: 3,
    tools: [
      { name: 'send_email', description: 'Send an email', schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
      { name: 'list_messages', description: 'List recent emails from inbox', schema: { type: 'object', properties: { maxResults: { type: 'number', default: 10 }, query: { type: 'string' } } } },
      { name: 'get_message', description: 'Get a specific email by ID', schema: { type: 'object', properties: { messageId: { type: 'string' } }, required: ['messageId'] } },
    ],
  },
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    description: 'Create events, check availability, manage calendars, and schedule meetings.',
    category: 'Productivity',
    authType: 'oauth',
    oauthProvider: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/calendar'],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    },
    tags: ['calendar', 'scheduling', 'google'],
    popularity: 4,
    toolCount: 3,
    tools: [
      { name: 'list_events', description: 'List upcoming calendar events', schema: { type: 'object', properties: { maxResults: { type: 'number', default: 10 }, timeMin: { type: 'string' } } } },
      { name: 'create_event', description: 'Create a new calendar event', schema: { type: 'object', properties: { summary: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, attendees: { type: 'array' } }, required: ['summary', 'start', 'end'] } },
      { name: 'delete_event', description: 'Delete a calendar event', schema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] } },
    ],
  },
  {
    slug: 'salesforce',
    name: 'Salesforce',
    description: 'Query records, manage leads, opportunities, and automate CRM operations.',
    category: 'CRM',
    authType: 'oauth',
    oauthProvider: 'salesforce',
    oauthScopes: ['api', 'refresh_token'],
    oauthConfig: {
      authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    },
    tags: ['crm', 'sales', 'enterprise'],
    popularity: 4,
    toolCount: 4,
    tools: [
      { name: 'query', description: 'Execute a SOQL query', schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'create_record', description: 'Create a new record', schema: { type: 'object', properties: { sobject: { type: 'string' }, fields: { type: 'object' } }, required: ['sobject', 'fields'] } },
      { name: 'update_record', description: 'Update an existing record', schema: { type: 'object', properties: { sobject: { type: 'string' }, id: { type: 'string' }, fields: { type: 'object' } }, required: ['sobject', 'id', 'fields'] } },
      { name: 'list_leads', description: 'List recent leads', schema: { type: 'object', properties: { limit: { type: 'number', default: 10 } } } },
    ],
  },
  {
    slug: 'jira',
    name: 'Jira',
    description: 'Create issues, manage sprints, track projects, and automate Agile workflows.',
    category: 'Project Management',
    authType: 'oauth',
    oauthProvider: 'atlassian',
    oauthScopes: ['read:jira-work', 'write:jira-work'],
    oauthConfig: {
      authUrl: 'https://auth.atlassian.com/authorize',
      tokenUrl: 'https://auth.atlassian.com/oauth/token',
    },
    tags: ['project-management', 'agile', 'tickets'],
    popularity: 4,
    toolCount: 4,
    tools: [
      { name: 'create_issue', description: 'Create a new Jira issue', schema: { type: 'object', properties: { project: { type: 'string' }, summary: { type: 'string' }, issuetype: { type: 'string' }, description: { type: 'string' } }, required: ['project', 'summary', 'issuetype'] } },
      { name: 'search_issues', description: 'Search issues using JQL', schema: { type: 'object', properties: { jql: { type: 'string' }, maxResults: { type: 'number', default: 10 } }, required: ['jql'] } },
      { name: 'get_issue', description: 'Get issue details', schema: { type: 'object', properties: { issueKey: { type: 'string' } }, required: ['issueKey'] } },
      { name: 'transition_issue', description: 'Transition an issue to a new status', schema: { type: 'object', properties: { issueKey: { type: 'string' }, transitionId: { type: 'string' } }, required: ['issueKey', 'transitionId'] } },
    ],
  },
  {
    slug: 'shopify',
    name: 'Shopify',
    description: 'Manage products, orders, customers, and inventory for your online store.',
    category: 'E-commerce',
    authType: 'api_key',
    tags: ['e-commerce', 'store', 'products', 'orders'],
    popularity: 4,
    toolCount: 4,
    tools: [
      { name: 'list_products', description: 'List products from your store', schema: { type: 'object', properties: { limit: { type: 'number', default: 10 } } } },
      { name: 'create_product', description: 'Create a new product', schema: { type: 'object', properties: { title: { type: 'string' }, body_html: { type: 'string' }, vendor: { type: 'string' }, product_type: { type: 'string' } }, required: ['title'] } },
      { name: 'list_orders', description: 'List recent orders', schema: { type: 'object', properties: { status: { type: 'string', enum: ['open', 'closed', 'cancelled', 'any'] }, limit: { type: 'number', default: 10 } } } },
      { name: 'get_customer', description: 'Get customer details', schema: { type: 'object', properties: { customer_id: { type: 'string' } }, required: ['customer_id'] } },
    ],
  },
  {
    slug: 'zendesk',
    name: 'Zendesk',
    description: 'Manage support tickets, users, and organizations for customer service.',
    category: 'Support',
    authType: 'api_key',
    tags: ['support', 'helpdesk', 'tickets', 'customer-service'],
    popularity: 3,
    toolCount: 3,
    tools: [
      { name: 'list_tickets', description: 'List support tickets', schema: { type: 'object', properties: { status: { type: 'string', enum: ['new', 'open', 'pending', 'solved'] }, limit: { type: 'number', default: 10 } } } },
      { name: 'create_ticket', description: 'Create a new support ticket', schema: { type: 'object', properties: { subject: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string', enum: ['urgent', 'high', 'normal', 'low'] } }, required: ['subject', 'description'] } },
      { name: 'update_ticket', description: 'Update a ticket', schema: { type: 'object', properties: { ticket_id: { type: 'string' }, status: { type: 'string' }, comment: { type: 'string' } }, required: ['ticket_id'] } },
    ],
  },
  {
    slug: 'airtable',
    name: 'Airtable',
    description: 'Query bases, create records, manage views, and build structured data workflows.',
    category: 'Database',
    authType: 'oauth',
    oauthProvider: 'airtable',
    oauthScopes: ['data.records:read', 'data.records:write', 'schema.bases:read'],
    oauthConfig: {
      authUrl: 'https://airtable.com/oauth2/v1/authorize',
      tokenUrl: 'https://airtable.com/oauth2/v1/token',
    },
    tags: ['database', 'spreadsheet', 'no-code'],
    popularity: 4,
    toolCount: 3,
    tools: [
      { name: 'list_records', description: 'List records from a table', schema: { type: 'object', properties: { base_id: { type: 'string' }, table_name: { type: 'string' }, max_records: { type: 'number', default: 100 } }, required: ['base_id', 'table_name'] } },
      { name: 'create_record', description: 'Create a new record', schema: { type: 'object', properties: { base_id: { type: 'string' }, table_name: { type: 'string' }, fields: { type: 'object' } }, required: ['base_id', 'table_name', 'fields'] } },
      { name: 'update_record', description: 'Update an existing record', schema: { type: 'object', properties: { base_id: { type: 'string' }, table_name: { type: 'string' }, record_id: { type: 'string' }, fields: { type: 'object' } }, required: ['base_id', 'table_name', 'record_id', 'fields'] } },
    ],
  },
  {
    slug: 'google-drive',
    name: 'Google Drive',
    description: 'Access files, upload documents, search content, and manage shared drives.',
    category: 'Storage',
    authType: 'oauth',
    oauthProvider: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    },
    tags: ['files', 'storage', 'google', 'documents'],
    popularity: 4,
    toolCount: 3,
    tools: [
      { name: 'list_files', description: 'List files in Google Drive', schema: { type: 'object', properties: { query: { type: 'string' }, pageSize: { type: 'number', default: 10 } } } },
      { name: 'get_file', description: 'Get file metadata', schema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] } },
      { name: 'search_files', description: 'Search for files', schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    ],
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    description: 'Manage payments, subscriptions, customers, invoices, and financial reporting.',
    category: 'Payments',
    authType: 'api_key',
    tags: ['payments', 'billing', 'subscriptions', 'invoices'],
    popularity: 5,
    toolCount: 5,
    isNew: true,
    tools: [
      { name: 'list_customers', description: 'List customers', schema: { type: 'object', properties: { limit: { type: 'number', default: 10 }, email: { type: 'string', description: 'Filter by email' } } } },
      { name: 'create_customer', description: 'Create a new customer', schema: { type: 'object', properties: { email: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['email'] } },
      { name: 'create_payment_intent', description: 'Create a payment intent', schema: { type: 'object', properties: { amount: { type: 'number', description: 'Amount in cents' }, currency: { type: 'string', default: 'usd' }, customer: { type: 'string' } }, required: ['amount', 'currency'] } },
      { name: 'list_subscriptions', description: 'List active subscriptions', schema: { type: 'object', properties: { customer: { type: 'string' }, status: { type: 'string', enum: ['active', 'past_due', 'canceled', 'all'] }, limit: { type: 'number', default: 10 } } } },
      { name: 'create_invoice', description: 'Create a draft invoice', schema: { type: 'object', properties: { customer: { type: 'string' }, auto_advance: { type: 'boolean', default: false } }, required: ['customer'] } },
    ],
  },
  {
    slug: 'twilio',
    name: 'Twilio',
    description: 'Send SMS, make calls, manage phone numbers, and build communication workflows.',
    category: 'Communication',
    authType: 'api_key',
    tags: ['sms', 'voice', 'phone', 'messaging'],
    popularity: 4,
    toolCount: 4,
    isNew: true,
    tools: [
      { name: 'send_sms', description: 'Send an SMS message', schema: { type: 'object', properties: { to: { type: 'string', description: 'Recipient phone number' }, from: { type: 'string', description: 'Twilio phone number' }, body: { type: 'string', description: 'Message body' } }, required: ['to', 'from', 'body'] } },
      { name: 'list_messages', description: 'List sent/received messages', schema: { type: 'object', properties: { limit: { type: 'number', default: 20 }, to: { type: 'string' }, from: { type: 'string' } } } },
      { name: 'make_call', description: 'Initiate an outbound call', schema: { type: 'object', properties: { to: { type: 'string' }, from: { type: 'string' }, url: { type: 'string', description: 'TwiML URL for call instructions' } }, required: ['to', 'from', 'url'] } },
      { name: 'list_phone_numbers', description: 'List your Twilio phone numbers', schema: { type: 'object', properties: { limit: { type: 'number', default: 20 } } } },
    ],
  },
  {
    slug: 'sendgrid',
    name: 'SendGrid',
    description: 'Send transactional and marketing emails, manage contacts, and track deliveries.',
    category: 'Communication',
    authType: 'api_key',
    tags: ['email', 'transactional', 'marketing', 'newsletters'],
    popularity: 4,
    toolCount: 4,
    isNew: true,
    tools: [
      { name: 'send_email', description: 'Send a transactional email', schema: { type: 'object', properties: { to: { type: 'string' }, from: { type: 'string' }, subject: { type: 'string' }, html: { type: 'string', description: 'HTML body' }, text: { type: 'string', description: 'Plain text body' } }, required: ['to', 'from', 'subject'] } },
      { name: 'list_contacts', description: 'List marketing contacts', schema: { type: 'object', properties: { page_size: { type: 'number', default: 50 } } } },
      { name: 'add_contact', description: 'Add or update a contact', schema: { type: 'object', properties: { email: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' } }, required: ['email'] } },
      { name: 'get_stats', description: 'Get email delivery statistics', schema: { type: 'object', properties: { start_date: { type: 'string', description: 'YYYY-MM-DD' }, end_date: { type: 'string' } }, required: ['start_date'] } },
    ],
  },
  {
    slug: 'linear',
    name: 'Linear',
    description: 'Manage issues, projects, cycles, and team workflows for modern software development.',
    category: 'Project Management',
    authType: 'api_key',
    tags: ['issues', 'project-management', 'agile', 'engineering'],
    popularity: 4,
    toolCount: 5,
    isNew: true,
    tools: [
      { name: 'list_issues', description: 'List issues with optional filters', schema: { type: 'object', properties: { teamId: { type: 'string' }, status: { type: 'string' }, assigneeId: { type: 'string' }, limit: { type: 'number', default: 25 } } } },
      { name: 'create_issue', description: 'Create a new issue', schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, teamId: { type: 'string' }, priority: { type: 'number', description: '0=None, 1=Urgent, 2=High, 3=Medium, 4=Low' }, assigneeId: { type: 'string' } }, required: ['title', 'teamId'] } },
      { name: 'update_issue', description: 'Update an existing issue', schema: { type: 'object', properties: { issueId: { type: 'string' }, title: { type: 'string' }, status: { type: 'string' }, priority: { type: 'number' } }, required: ['issueId'] } },
      { name: 'list_projects', description: 'List projects', schema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } },
      { name: 'list_cycles', description: 'List cycles for a team', schema: { type: 'object', properties: { teamId: { type: 'string' } }, required: ['teamId'] } },
    ],
  },
  {
    slug: 'discord',
    name: 'Discord',
    description: 'Send messages, manage channels, moderate servers, and automate community workflows.',
    category: 'Communication',
    authType: 'oauth',
    oauthProvider: 'discord',
    oauthScopes: ['bot', 'guilds', 'messages.read'],
    oauthConfig: {
      authUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      revokeUrl: 'https://discord.com/api/oauth2/token/revoke',
    },
    tags: ['chat', 'community', 'gaming', 'bots'],
    popularity: 4,
    toolCount: 4,
    isNew: true,
    tools: [
      { name: 'send_message', description: 'Send a message to a channel', schema: { type: 'object', properties: { channel_id: { type: 'string' }, content: { type: 'string' }, embeds: { type: 'array', description: 'Rich embed objects' } }, required: ['channel_id', 'content'] } },
      { name: 'list_guilds', description: 'List servers the bot is in', schema: { type: 'object', properties: { limit: { type: 'number', default: 20 } } } },
      { name: 'list_channels', description: 'List channels in a server', schema: { type: 'object', properties: { guild_id: { type: 'string' } }, required: ['guild_id'] } },
      { name: 'get_user', description: 'Get information about a user', schema: { type: 'object', properties: { user_id: { type: 'string' } }, required: ['user_id'] } },
    ],
  },
  {
    slug: 'asana',
    name: 'Asana',
    description: 'Create tasks, manage projects, track goals, and coordinate team workloads.',
    category: 'Project Management',
    authType: 'oauth',
    oauthProvider: 'asana',
    oauthScopes: ['default'],
    oauthConfig: {
      authUrl: 'https://app.asana.com/-/oauth_authorize',
      tokenUrl: 'https://app.asana.com/-/oauth_token',
    },
    tags: ['tasks', 'project-management', 'teams', 'goals'],
    popularity: 4,
    toolCount: 4,
    isNew: true,
    tools: [
      { name: 'list_tasks', description: 'List tasks in a project', schema: { type: 'object', properties: { project: { type: 'string' }, assignee: { type: 'string' }, completed_since: { type: 'string' } }, required: ['project'] } },
      { name: 'create_task', description: 'Create a new task', schema: { type: 'object', properties: { name: { type: 'string' }, projects: { type: 'array' }, assignee: { type: 'string' }, due_on: { type: 'string' }, notes: { type: 'string' } }, required: ['name'] } },
      { name: 'update_task', description: 'Update an existing task', schema: { type: 'object', properties: { task_id: { type: 'string' }, name: { type: 'string' }, completed: { type: 'boolean' }, due_on: { type: 'string' } }, required: ['task_id'] } },
      { name: 'list_projects', description: 'List projects in a workspace', schema: { type: 'object', properties: { workspace: { type: 'string' }, limit: { type: 'number', default: 20 } }, required: ['workspace'] } },
    ],
  },
  {
    slug: 'monday',
    name: 'Monday.com',
    description: 'Manage boards, items, updates, and automate work OS workflows.',
    category: 'Project Management',
    authType: 'api_key',
    tags: ['project-management', 'work-os', 'boards', 'automation'],
    popularity: 4,
    toolCount: 4,
    isNew: true,
    tools: [
      { name: 'list_boards', description: 'List all boards', schema: { type: 'object', properties: { limit: { type: 'number', default: 25 }, page: { type: 'number', default: 1 } } } },
      { name: 'list_items', description: 'List items in a board', schema: { type: 'object', properties: { board_id: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['board_id'] } },
      { name: 'create_item', description: 'Create a new item on a board', schema: { type: 'object', properties: { board_id: { type: 'string' }, item_name: { type: 'string' }, column_values: { type: 'object', description: 'Column values as JSON' } }, required: ['board_id', 'item_name'] } },
      { name: 'add_update', description: 'Add an update/comment to an item', schema: { type: 'object', properties: { item_id: { type: 'string' }, body: { type: 'string' } }, required: ['item_id', 'body'] } },
    ],
  },
  {
    slug: 'intercom',
    name: 'Intercom',
    description: 'Manage conversations, contacts, articles, and automate customer engagement.',
    category: 'Support',
    authType: 'oauth',
    oauthProvider: 'intercom',
    oauthScopes: [],
    oauthConfig: {
      authUrl: 'https://app.intercom.com/oauth',
      tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    },
    tags: ['support', 'chat', 'customer-engagement', 'helpdesk'],
    popularity: 4,
    toolCount: 4,
    isNew: true,
    tools: [
      { name: 'list_conversations', description: 'List conversations', schema: { type: 'object', properties: { order: { type: 'string', enum: ['created_at', 'updated_at'] }, limit: { type: 'number', default: 20 } } } },
      { name: 'reply_conversation', description: 'Reply to a conversation', schema: { type: 'object', properties: { conversation_id: { type: 'string' }, body: { type: 'string' }, message_type: { type: 'string', enum: ['comment', 'note'], default: 'comment' } }, required: ['conversation_id', 'body'] } },
      { name: 'search_contacts', description: 'Search for contacts', schema: { type: 'object', properties: { query: { type: 'string' }, field: { type: 'string', enum: ['email', 'name', 'phone'] } }, required: ['query'] } },
      { name: 'list_articles', description: 'List help center articles', schema: { type: 'object', properties: { limit: { type: 'number', default: 20 } } } },
    ],
  },
];

const CATEGORIES = ['All', 'Communication', 'Development', 'Productivity', 'CRM', 'Payments', 'E-commerce', 'Project Management', 'Support', 'Database', 'Storage'];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [installing, setInstalling] = useState<string | null>(null);
  const { connectors, loading: connectorsLoading } = useConnectors();
  const { toast } = useToast();

  const installedSlugs = new Set(connectors.map(c => c.slug));

  const filtered = MARKETPLACE_CONNECTORS.filter(c => {
    const matchesSearch = !search || 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = useCallback(async (connector: MarketplaceConnector) => {
    setInstalling(connector.slug);
    try {
      // 1. Insert connector
      const { data: newConnector, error: connError } = await supabase
        .from('connectors')
        .upsert({
          slug: connector.slug,
          name: connector.name,
          description: connector.description,
          category: connector.category,
          auth_type: connector.authType,
          icon_url: `/connectors/${connector.slug}.svg`,
          oauth_provider: connector.oauthProvider || null,
          oauth_scopes: connector.oauthScopes || null,
          oauth_config: connector.oauthConfig || null,
          is_active: true,
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (connError) throw connError;

      // 2. Insert tools
      if (newConnector && connector.tools.length > 0) {
        const toolRows = connector.tools.map(t => ({
          connector_id: newConnector.id,
          name: t.name,
          description: t.description,
          schema: t.schema as unknown as import('@/integrations/supabase/types').Json,
          source: 'rest' as const,
        }));

        const { error: toolsError } = await supabase
          .from('connector_tools')
          .upsert(toolRows, { onConflict: 'connector_id,name', ignoreDuplicates: true });

        if (toolsError) {
          console.warn('Some tools may already exist:', toolsError.message);
        }
      }

      toast({
        title: `${connector.name} installed!`,
        description: `${connector.toolCount} tools are now available. Connect your account to start using them.`,
      });

      // Refresh connector list
      window.location.reload();
    } catch (err: any) {
      toast({
        title: 'Installation failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setInstalling(null);
    }
  }, [toast]);

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
              <p className="text-muted-foreground">
                One-click install popular services. Your AI assistants get instant access to all installed tools.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connectors, tools, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>{filtered.length} connector{filtered.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{filtered.reduce((sum, c) => sum + c.toolCount, 0)} total tools</span>
        </div>

        {/* Featured Popular Services */}
        {selectedCategory === 'All' && !search && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Popular Services — One-Click Install</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MARKETPLACE_CONNECTORS
                .filter(c => ['hubspot', 'salesforce', 'zendesk', 'shopify'].includes(c.slug))
                .map(connector => {
                  const isInstalled = installedSlugs.has(connector.slug);
                  const isInstallingThis = installing === connector.slug;
                  return (
                    <Card key={connector.slug} className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <ConnectorIcon slug={connector.slug} name={connector.name} className="h-10 w-10 shrink-0" />
                          <div>
                            <h3 className="font-semibold text-foreground">{connector.name}</h3>
                            <p className="text-xs text-muted-foreground">{connector.toolCount} tools</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{connector.description}</p>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            size="sm"
                            variant={isInstalled ? 'outline' : 'glow'}
                            disabled={isInstalled || isInstallingThis}
                            onClick={() => handleInstall(connector)}
                          >
                            {isInstallingThis ? 'Installing...' : isInstalled ? (
                              <><Check className="h-3 w-3" /> Installed</>
                            ) : (
                              <><Zap className="h-3 w-3" /> Install</>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/marketplace/${connector.slug}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((connector) => {
            const isInstalled = installedSlugs.has(connector.slug);
            const isInstalling = installing === connector.slug;

            return (
              <Card
                key={connector.slug}
                className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
              >
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {connector.isNew && (
                    <Badge className="gap-1 text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
                      <Sparkles className="h-3 w-3" />
                      New
                    </Badge>
                  )}
                  {isInstalled && (
                    <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                      <Check className="h-3 w-3" />
                      Installed
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <ConnectorIcon slug={connector.slug} name={connector.name} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        <Link to={`/marketplace/${connector.slug}`} className="hover:underline">
                          {connector.name}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {connector.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {connector.popularity}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {connector.description}
                  </CardDescription>

                  {/* Tools preview */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {connector.toolCount} Tools included
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {connector.tools.slice(0, 3).map(tool => (
                        <Badge key={tool.name} variant="secondary" className="text-xs font-mono">
                          {tool.name}
                        </Badge>
                      ))}
                      {connector.tools.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{connector.tools.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {connector.tags.map(tag => (
                      <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={isInstalled ? 'outline' : 'glow'}
                      disabled={isInstalled || isInstalling}
                      onClick={() => handleInstall(connector)}
                    >
                      {isInstalling ? (
                        <>Installing...</>
                      ) : isInstalled ? (
                        <>
                          <Check className="h-4 w-4" />
                          Installed
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Install
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/marketplace/${connector.slug}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Filter className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No connectors match your search.</p>
            <Button variant="ghost" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
