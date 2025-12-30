import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbConnectorTool = Database['public']['Tables']['connector_tools']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];
type DbPipelineJob = Database['public']['Tables']['pipeline_jobs']['Row'];
type DbPipelineEvent = Database['public']['Tables']['pipeline_events']['Row'];
type DbActionLog = Database['public']['Tables']['action_logs']['Row'];

/**
 * Custom hook that manages connector data and provides methods for connector operations.
 * 
 * Handles:
 * - Fetching and caching connector data (connectors, tools, connections)
 * - Real-time subscriptions for jobs, connections, and events
 * - CRUD operations (connect, disconnect, execute tools)
 * - User-scoped data isolation
 * 
 * @returns {Object} Connector data and action methods
 * @returns {DbConnector[]} returns.connectors - All available connectors
 * @returns {Map<string, DbConnectorTool[]>} returns.tools - Tools mapped by connector ID
 * @returns {DbUserConnection[]} returns.connections - User's active connections
 * @returns {DbPipelineJob[]} returns.jobs - Recent pipeline jobs (limit 50)
 * @returns {Map<string, DbPipelineEvent[]>} returns.events - Events mapped by job ID
 * @returns {DbActionLog[]} returns.logs - Action audit logs (limit 100)
 * @returns {boolean} returns.loading - Loading state for initial data fetch
 * @returns {Function} returns.connect - Create a connection to a connector
 * @returns {Function} returns.disconnect - Revoke an active connection
 * @returns {Function} returns.executeTool - Execute a connector tool
 * @returns {Function} returns.getConnectorWithConnection - Get connector with connection status
 * @returns {Function} returns.getToolsForConnector - Get tools for a specific connector
 * @returns {Function} returns.fetchEventsForJob - Fetch events for a specific job
 * 
 * @example
 * ```tsx
 * function ConnectorsPage() {
 *   const { connectors, connections, connect, loading } = useConnectorData();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   
 *   return (
 *     <div>
 *       {connectors.map(connector => (
 *         <ConnectorCard 
 *           key={connector.id}
 *           connector={connector}
 *           onConnect={connect}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConnectorData() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [connectors, setConnectors] = useState<DbConnector[]>([]);
  const [tools, setTools] = useState<Map<string, DbConnectorTool[]>>(new Map());
  const [connections, setConnections] = useState<DbUserConnection[]>([]);
  const [jobs, setJobs] = useState<DbPipelineJob[]>([]);
  const [events, setEvents] = useState<Map<string, DbPipelineEvent[]>>(new Map());
  const [logs, setLogs] = useState<DbActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch connectors
  const fetchConnectors = useCallback(async () => {
    const { data, error } = await supabase
      .from('connectors')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching connectors:', error);
      return;
    }
    setConnectors(data || []);
  }, []);

  // Fetch tools for all connectors
  const fetchTools = useCallback(async () => {
    const { data, error } = await supabase
      .from('connector_tools')
      .select('*');
    
    if (error) {
      console.error('Error fetching tools:', error);
      return;
    }
    
    const toolMap = new Map<string, DbConnectorTool[]>();
    (data || []).forEach(tool => {
      const existing = toolMap.get(tool.connector_id) || [];
      toolMap.set(tool.connector_id, [...existing, tool]);
    });
    setTools(toolMap);
  }, []);

  // Fetch user connections
  const fetchConnections = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching connections:', error);
      return;
    }
    setConnections(data || []);
  }, [user]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }
    setJobs(data || []);
  }, [user]);

  // Fetch events for jobs
  const fetchEventsForJob = useCallback(async (jobId: string) => {
    const { data, error } = await supabase
      .from('pipeline_events')
      .select('*')
      .eq('job_id', jobId)
      .order('ts', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    setEvents(prev => {
      const newMap = new Map(prev);
      newMap.set(jobId, data || []);
      return newMap;
    });
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching logs:', error);
      return;
    }
    setLogs(data || []);
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchConnectors(),
        fetchTools(),
      ]);
      if (user) {
        await Promise.all([
          fetchConnections(),
          fetchJobs(),
          fetchLogs(),
        ]);
      }
      setLoading(false);
    };
    
    loadData();
  }, [user, fetchConnectors, fetchTools, fetchConnections, fetchJobs, fetchLogs]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to job status changes
    const jobsChannel = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new as DbPipelineJob, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(j => 
              j.id === (payload.new as DbPipelineJob).id 
                ? payload.new as DbPipelineJob 
                : j
            ));
          }
        }
      )
      .subscribe();

    // Subscribe to connection status changes
    const connectionsChannel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConnections(prev => [...prev, payload.new as DbUserConnection]);
          } else if (payload.eventType === 'UPDATE') {
            setConnections(prev => prev.map(c => 
              c.id === (payload.new as DbUserConnection).id 
                ? payload.new as DbUserConnection 
                : c
            ));
          } else if (payload.eventType === 'DELETE') {
            setConnections(prev => prev.filter(c => 
              c.id !== (payload.old as DbUserConnection).id
            ));
          }
        }
      )
      .subscribe();

    // Subscribe to pipeline events
    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pipeline_events',
        },
        (payload) => {
          const newEvent = payload.new as DbPipelineEvent;
          setEvents(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(newEvent.job_id) || [];
            newMap.set(newEvent.job_id, [...existing, newEvent]);
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(connectionsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [user]);

  /**
   * Creates a connection to a connector for the current user.
   * 
   * For OAuth connectors, this would initiate the OAuth flow in production.
   * Currently simulates a successful connection by creating an active connection directly.
   * 
   * @param {string} connectorId - UUID of the connector to connect to
   * @returns {Promise<void>}
   * @throws {Error} If user is not authenticated
   * 
   * @example
   * ```tsx
   * const { connect } = useConnectorData();
   * 
   * async function handleConnect(connectorId: string) {
   *   await connect(connectorId);
   *   // Connection created, UI will update via real-time subscription
   * }
   * ```
   * 
   * @todo Implement actual OAuth flow with PKCE
   * @todo Add error retry logic
   * @todo Support API key authentication flow
   */
  // Connect to a connector (create pending connection)
  const connect = useCallback(async (connectorId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to connect to services.',
        variant: 'destructive',
      });
      return;
    }

    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return;

    // For OAuth connectors, we would redirect to the OAuth flow
    // For now, create a connection directly (simulating successful OAuth)
    const { error } = await supabase
      .from('user_connections')
      .upsert({
        user_id: user.id,
        connector_id: connectorId,
        status: 'active',
        scopes: connector.oauth_scopes || [],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,connector_id',
      });

    if (error) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Connected',
      description: `Successfully connected to ${connector.name}`,
    });

    await fetchConnections();
  }, [user, connectors, toast, fetchConnections]);

  /**
   * Disconnects from a connector by revoking the user's connection.
   * 
   * Sets the connection status to 'revoked' rather than deleting the record
   * to maintain audit history.
   * 
   * @param {string} connectionId - UUID of the connection to revoke
   * @returns {Promise<void>}
   * 
   * @example
   * ```tsx
   * const { connections, disconnect } = useConnectorData();
   * 
   * function DisconnectButton({ connectionId }: { connectionId: string }) {
   *   return (
   *     <Button onClick={() => disconnect(connectionId)}>
   *       Disconnect
   *     </Button>
   *   );
   * }
   * ```
   * 
   * @todo Add confirmation dialog before disconnecting
   * @todo Handle OAuth token revocation with provider
   */
  // Disconnect from a connector
  const disconnect = useCallback(async (connectionId: string) => {
    const { error } = await supabase
      .from('user_connections')
      .update({ 
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: 'Disconnect Failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Disconnected',
      description: 'Connection has been revoked.',
    });
  }, [toast]);

  /**
   * Executes a connector tool with the provided arguments.
   * 
   * Creates a pipeline job and simulates execution with status updates and events.
   * In production, this would call a Supabase Edge Function to actually execute the tool.
   * 
   * @param {string} connectorSlug - URL-safe connector identifier (e.g., 'github')
   * @param {string} toolName - Name of the tool to execute (e.g., 'create_issue')
   * @param {Record<string, unknown>} args - Tool execution arguments
   * @returns {Promise<DbPipelineJob>} The created pipeline job
   * @throws {Error} If user not authenticated or connector not found
   * 
   * @example
   * ```tsx
   * const { executeTool } = useConnectorData();
   * 
   * async function createGitHubIssue() {
   *   const job = await executeTool('github', 'create_issue', {
   *     repository: 'owner/repo',
   *     title: 'Bug report',
   *     body: 'Description of the bug'
   *   });
   *   
   *   console.log('Job created:', job.id);
   *   // Job status will update via real-time subscription
   * }
   * ```
   * 
   * @todo Replace setTimeout with Supabase Edge Function call
   * @todo Add input validation using tool schema
   * @todo Implement retry logic for failed jobs
   * @todo Add timeout handling
   */
  // Execute a tool
  const executeTool = useCallback(async (
    connectorSlug: string,
    toolName: string,
    args: Record<string, unknown>
  ) => {
    if (!user) {
      throw new Error('Authentication required');
    }

    const connector = connectors.find(c => c.slug === connectorSlug);
    if (!connector) {
      throw new Error('Connector not found');
    }

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('pipeline_jobs')
      .insert([{
        user_id: user.id,
        connector_id: connector.id,
        type: 'tool_execution',
        status: 'queued' as const,
        input: args as Database['public']['Tables']['pipeline_jobs']['Insert']['input'],
      }])
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(jobError?.message || 'Failed to create job');
    }

    // Add initial event
    await supabase
      .from('pipeline_events')
      .insert({
        job_id: job.id,
        level: 'info',
        message: `Starting ${toolName} on ${connector.name}`,
      });

    // Simulate job execution (in production, this would call an edge function)
    setTimeout(async () => {
      await supabase
        .from('pipeline_jobs')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      await supabase
        .from('pipeline_events')
        .insert({
          job_id: job.id,
          level: 'info',
          message: 'Processing request...',
        });
    }, 500);

    setTimeout(async () => {
      const success = Math.random() > 0.2;
      
      await supabase
        .from('pipeline_jobs')
        .update({ 
          status: success ? 'succeeded' : 'failed',
          output: success ? { result: 'Sample output data', toolName } : null,
          error: success ? null : 'Simulated error for demo',
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      await supabase
        .from('pipeline_events')
        .insert({
          job_id: job.id,
          level: success ? 'info' : 'error',
          message: success ? 'Tool execution completed successfully' : 'Tool execution failed',
        });

      // Create action log
      await supabase
        .from('action_logs')
        .insert([{
          user_id: user.id,
          connector_id: connector.id,
          tool_name: toolName,
          request: args as Database['public']['Tables']['action_logs']['Insert']['request'],
          response: success ? { result: 'Sample output' } : null,
          status: success ? 'success' : 'error',
          error: success ? null : 'Simulated error',
          latency_ms: Math.floor(1500 + Math.random() * 500),
        }]);

      fetchLogs();
    }, 2000);

    return job;
  }, [user, connectors, fetchLogs]);

  // Get connector with its connection status
  const getConnectorWithConnection = useCallback((slug: string) => {
    const connector = connectors.find(c => c.slug === slug);
    if (!connector) return undefined;
    
    const connection = connections.find(c => c.connector_id === connector.id);
    const connectorTools = tools.get(connector.id) || [];
    
    return { ...connector, connection, tools: connectorTools };
  }, [connectors, connections, tools]);

  // Get tools for a connector
  const getToolsForConnector = useCallback((connectorId: string) => {
    return tools.get(connectorId) || [];
  }, [tools]);

  return {
    connectors,
    tools,
    connections,
    jobs,
    events,
    logs,
    loading,
    connect,
    disconnect,
    executeTool,
    getConnectorWithConnection,
    getToolsForConnector,
    fetchEventsForJob,
    refetch: {
      connectors: fetchConnectors,
      connections: fetchConnections,
      jobs: fetchJobs,
      logs: fetchLogs,
    },
  };
}
