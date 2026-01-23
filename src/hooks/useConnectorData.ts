import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbConnectorTool = Database['public']['Tables']['connector_tools']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];
type DbPipelineJob = Database['public']['Tables']['pipeline_jobs']['Row'];
type DbPipelineEvent = Database['public']['Tables']['pipeline_events']['Row'];
type DbActionLog = Database['public']['Tables']['action_logs']['Row'];

// Internal user ID for this internal app (no auth required)
const INTERNAL_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Custom hook that manages connector data and provides methods for connector operations.
 * 
 * Handles:
 * - Fetching and caching connector data (connectors, tools, connections)
 * - Real-time subscriptions for jobs, connections, and events
 * - CRUD operations (connect, disconnect, execute tools)
 * 
 * @returns {Object} Connector data and action methods
 */
export function useConnectorData() {
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
    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', INTERNAL_USER_ID);
    
    if (error) {
      console.error('Error fetching connections:', error);
      return;
    }
    setConnections(data || []);
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .select('*')
      .eq('user_id', INTERNAL_USER_ID)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }
    setJobs(data || []);
  }, []);

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
    const { data, error } = await supabase
      .from('action_logs')
      .select('*')
      .eq('user_id', INTERNAL_USER_ID)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching logs:', error);
      return;
    }
    setLogs(data || []);
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchConnectors(),
        fetchTools(),
        fetchConnections(),
        fetchJobs(),
        fetchLogs(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchConnectors, fetchTools, fetchConnections, fetchJobs, fetchLogs]);

  // Set up realtime subscriptions
  useEffect(() => {
    // Subscribe to job status changes
    const jobsChannel = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_jobs',
          filter: `user_id=eq.${INTERNAL_USER_ID}`,
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
          filter: `user_id=eq.${INTERNAL_USER_ID}`,
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
  }, []);

  // Connect to a connector (create pending connection)
  const connect = useCallback(async (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return;

    const { error } = await supabase
      .from('user_connections')
      .upsert({
        user_id: INTERNAL_USER_ID,
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
  }, [connectors, toast, fetchConnections]);

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

  // Execute a tool via edge function
  const executeTool = useCallback(async (
    connectorSlug: string,
    toolName: string,
    args: Record<string, unknown>
  ) => {
    const connector = connectors.find(c => c.slug === connectorSlug);
    if (!connector) {
      throw new Error('Connector not found');
    }

    // Create the job first
    const { data: job, error: jobError } = await supabase
      .from('pipeline_jobs')
      .insert([{
        user_id: INTERNAL_USER_ID,
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
        message: `Queued ${toolName} on ${connector.name}`,
      });

    // Call the edge function (non-blocking)
    supabase.functions.invoke('execute-tool', {
      body: {
        jobId: job.id,
        connectorId: connector.id,
        toolName,
        args,
        userId: INTERNAL_USER_ID,
      },
    }).then(({ error }) => {
      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: 'Execution Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      // Refresh logs after execution completes
      fetchLogs();
    }).catch((err) => {
      console.error('Edge function call failed:', err);
    });

    return job;
  }, [connectors, fetchLogs, toast]);

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
