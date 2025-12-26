import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Connector, 
  ConnectorTool, 
  UserConnection, 
  PipelineJob, 
  PipelineEvent,
  ActionLog,
  ConnectionStatus,
  JobStatus,
  ConnectorWithConnection
} from '@/types';
import { SEED_CONNECTORS, SEED_TOOLS } from '@/types/seed-data';

interface ConnectorContextType {
  connectors: Connector[];
  tools: Map<string, ConnectorTool[]>;
  connections: UserConnection[];
  jobs: PipelineJob[];
  events: Map<string, PipelineEvent[]>;
  logs: ActionLog[];
  
  // Actions
  getConnectorWithConnection: (slug: string) => ConnectorWithConnection | undefined;
  getToolsForConnector: (connectorId: string) => ConnectorTool[];
  connect: (connectorId: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  executeTool: (connectorSlug: string, toolName: string, args: Record<string, unknown>) => Promise<PipelineJob>;
  addEvent: (jobId: string, event: Omit<PipelineEvent, 'id'>) => void;
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export function ConnectorProvider({ children }: { children: React.ReactNode }) {
  const [connectors] = useState<Connector[]>(SEED_CONNECTORS);
  const [tools] = useState<Map<string, ConnectorTool[]>>(() => {
    const map = new Map<string, ConnectorTool[]>();
    SEED_TOOLS.forEach(tool => {
      const existing = map.get(tool.connectorId) || [];
      map.set(tool.connectorId, [...existing, tool]);
    });
    return map;
  });
  
  const [connections, setConnections] = useState<UserConnection[]>([
    // Demo: Some pre-connected connectors
    {
      id: 'conn-user-github',
      userId: 'demo-user',
      connectorId: 'conn-github',
      status: 'active',
      scopes: ['repo', 'read:user'],
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'conn-user-slack',
      userId: 'demo-user',
      connectorId: 'conn-slack',
      status: 'active',
      scopes: ['channels:read', 'chat:write'],
      lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);
  
  const [jobs, setJobs] = useState<PipelineJob[]>([
    {
      id: 'job-1',
      userId: 'demo-user',
      connectorId: 'conn-github',
      toolName: 'list_repositories',
      type: 'tool_execution',
      status: 'succeeded',
      input: { visibility: 'all', per_page: 10 },
      output: { repositories: ['repo1', 'repo2', 'repo3'] },
      startedAt: new Date(Date.now() - 60000).toISOString(),
      finishedAt: new Date(Date.now() - 58000).toISOString(),
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 'job-2',
      userId: 'demo-user',
      connectorId: 'conn-slack',
      toolName: 'send_message',
      type: 'tool_execution',
      status: 'running',
      input: { channel: '#general', text: 'Hello from MCP Hub!' },
      startedAt: new Date(Date.now() - 5000).toISOString(),
      createdAt: new Date(Date.now() - 5000).toISOString(),
    },
  ]);
  
  const [events, setEvents] = useState<Map<string, PipelineEvent[]>>(() => {
    const map = new Map<string, PipelineEvent[]>();
    map.set('job-1', [
      { id: 'evt-1', jobId: 'job-1', ts: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Starting tool execution' },
      { id: 'evt-2', jobId: 'job-1', ts: new Date(Date.now() - 59000).toISOString(), level: 'info', message: 'Fetching repositories from GitHub API' },
      { id: 'evt-3', jobId: 'job-1', ts: new Date(Date.now() - 58000).toISOString(), level: 'info', message: 'Successfully retrieved 3 repositories' },
    ]);
    map.set('job-2', [
      { id: 'evt-4', jobId: 'job-2', ts: new Date(Date.now() - 5000).toISOString(), level: 'info', message: 'Starting message delivery' },
      { id: 'evt-5', jobId: 'job-2', ts: new Date(Date.now() - 3000).toISOString(), level: 'info', message: 'Connecting to Slack workspace' },
    ]);
    return map;
  });
  
  const [logs, setLogs] = useState<ActionLog[]>([
    {
      id: 'log-1',
      userId: 'demo-user',
      connectorId: 'conn-github',
      toolName: 'list_repositories',
      request: { visibility: 'all' },
      response: { count: 3 },
      status: 'success',
      latencyMs: 245,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
  ]);

  const getConnectorWithConnection = useCallback((slug: string): ConnectorWithConnection | undefined => {
    const connector = connectors.find(c => c.slug === slug);
    if (!connector) return undefined;
    
    const connection = connections.find(c => c.connectorId === connector.id);
    const connectorTools = tools.get(connector.id) || [];
    
    return { ...connector, connection, tools: connectorTools };
  }, [connectors, connections, tools]);

  const getToolsForConnector = useCallback((connectorId: string): ConnectorTool[] => {
    return tools.get(connectorId) || [];
  }, [tools]);

  const connect = useCallback(async (connectorId: string) => {
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newConnection: UserConnection = {
      id: `conn-user-${Date.now()}`,
      userId: 'demo-user',
      connectorId,
      status: 'active',
      scopes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setConnections(prev => [...prev, newConnection]);
  }, []);

  const disconnect = useCallback(async (connectionId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setConnections(prev => 
      prev.map(c => 
        c.id === connectionId 
          ? { ...c, status: 'revoked' as ConnectionStatus, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const executeTool = useCallback(async (
    connectorSlug: string, 
    toolName: string, 
    args: Record<string, unknown>
  ): Promise<PipelineJob> => {
    const connector = connectors.find(c => c.slug === connectorSlug);
    if (!connector) throw new Error('Connector not found');
    
    const jobId = `job-${Date.now()}`;
    const newJob: PipelineJob = {
      id: jobId,
      userId: 'demo-user',
      connectorId: connector.id,
      toolName,
      type: 'tool_execution',
      status: 'queued',
      input: args,
      createdAt: new Date().toISOString(),
    };
    
    setJobs(prev => [newJob, ...prev]);
    
    // Simulate job execution
    setTimeout(() => {
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'running' as JobStatus, startedAt: new Date().toISOString() }
          : j
      ));
      
      addEvent(jobId, {
        jobId,
        ts: new Date().toISOString(),
        level: 'info',
        message: `Executing ${toolName} on ${connector.name}`,
      });
    }, 500);
    
    setTimeout(() => {
      addEvent(jobId, {
        jobId,
        ts: new Date().toISOString(),
        level: 'info',
        message: 'Processing request...',
      });
    }, 1000);
    
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { 
              ...j, 
              status: success ? 'succeeded' as JobStatus : 'failed' as JobStatus,
              output: success ? { result: 'Sample output data' } : undefined,
              error: success ? undefined : 'Simulated error for demo',
              finishedAt: new Date().toISOString(),
            }
          : j
      ));
      
      addEvent(jobId, {
        jobId,
        ts: new Date().toISOString(),
        level: success ? 'info' : 'error',
        message: success ? 'Tool execution completed successfully' : 'Tool execution failed',
      });
      
      // Add to logs
      const newLog: ActionLog = {
        id: `log-${Date.now()}`,
        userId: 'demo-user',
        connectorId: connector.id,
        toolName,
        request: args,
        response: success ? { result: 'Sample output' } : undefined,
        status: success ? 'success' : 'error',
        error: success ? undefined : 'Simulated error',
        latencyMs: 1500 + Math.random() * 500,
        createdAt: new Date().toISOString(),
      };
      setLogs(prev => [newLog, ...prev]);
    }, 2000);
    
    return newJob;
  }, [connectors]);

  const addEvent = useCallback((jobId: string, event: Omit<PipelineEvent, 'id'>) => {
    const newEvent: PipelineEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setEvents(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(jobId) || [];
      newMap.set(jobId, [...existing, newEvent]);
      return newMap;
    });
  }, []);

  return (
    <ConnectorContext.Provider
      value={{
        connectors,
        tools,
        connections,
        jobs,
        events,
        logs,
        getConnectorWithConnection,
        getToolsForConnector,
        connect,
        disconnect,
        executeTool,
        addEvent,
      }}
    >
      {children}
    </ConnectorContext.Provider>
  );
}

export function useConnectors() {
  const context = useContext(ConnectorContext);
  if (!context) {
    throw new Error('useConnectors must be used within a ConnectorProvider');
  }
  return context;
}
