import React, { createContext, useContext } from 'react';
import { useConnectorData } from '@/hooks/useConnectorData';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbConnectorTool = Database['public']['Tables']['connector_tools']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];
type DbPipelineJob = Database['public']['Tables']['pipeline_jobs']['Row'];
type DbPipelineEvent = Database['public']['Tables']['pipeline_events']['Row'];
type DbActionLog = Database['public']['Tables']['action_logs']['Row'];

interface ConnectorWithConnection extends DbConnector {
  connection?: DbUserConnection;
  tools: DbConnectorTool[];
}

interface ConnectorContextType {
  connectors: DbConnector[];
  tools: Map<string, DbConnectorTool[]>;
  connections: DbUserConnection[];
  jobs: DbPipelineJob[];
  events: Map<string, DbPipelineEvent[]>;
  logs: DbActionLog[];
  loading: boolean;
  
  // Actions
  getConnectorWithConnection: (slug: string) => ConnectorWithConnection | undefined;
  getToolsForConnector: (connectorId: string) => DbConnectorTool[];
  connect: (connectorId: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  executeTool: (connectorSlug: string, toolName: string, args: Record<string, unknown>) => Promise<DbPipelineJob>;
  fetchEventsForJob: (jobId: string) => Promise<void>;
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export function ConnectorProvider({ children }: { children: React.ReactNode }) {
  const connectorData = useConnectorData();

  return (
    <ConnectorContext.Provider value={connectorData}>
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
