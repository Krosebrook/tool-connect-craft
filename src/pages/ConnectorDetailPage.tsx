import { Layout } from '@/components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import { useConnectors } from '@/context/ConnectorContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConnectorIcon } from '@/components/connectors/ConnectorIcon';
import { ToolExecutor } from '@/components/connectors/ToolExecutor';
import { JobCard } from '@/components/connectors/JobCard';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { ToolSchema } from '@/types';
import { 
  ArrowLeft, 
  Plug2, 
  RefreshCw,
  Settings,
  Trash2,
  Clock,
  Code2
} from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export default function ConnectorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getConnectorWithConnection, connect, disconnect, executeTool, jobs } = useConnectors();
  const [connectingState, setConnectingState] = useState<'idle' | 'connecting' | 'disconnecting'>('idle');
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const connectorData = slug ? getConnectorWithConnection(slug) : undefined;
  
  if (!connectorData) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Connector not found</h1>
          <Button asChild variant="outline">
            <Link to="/connectors" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Connectors
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  const { connection, tools = [] } = connectorData;
  const status = connection?.status || 'pending';
  const isConnected = status === 'active';
  
  const connectorJobs = jobs.filter(j => j.connector_id === connectorData.id);
  
  const handleConnect = async () => {
    setConnectingState('connecting');
    try {
      await connect(connectorData.id);
      toast({
        title: 'Connected successfully',
        description: `${connectorData.name} is now connected.`,
      });
    } finally {
      setConnectingState('idle');
    }
  };
  
  const handleDisconnect = async () => {
    if (!connection) return;
    setConnectingState('disconnecting');
    try {
      await disconnect(connection.id);
      toast({
        title: 'Disconnected',
        description: `${connectorData.name} has been disconnected.`,
      });
    } finally {
      setConnectingState('idle');
    }
  };
  
  const handleExecuteTool = async (toolName: string, args: Record<string, unknown>) => {
    setExecutingTool(toolName);
    try {
      await executeTool(slug!, toolName, args);
      toast({
        title: 'Tool executed',
        description: `${toolName} is running...`,
      });
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setExecutingTool(null);
    }
  };
  
  const activeTool = selectedTool ? tools.find(t => t.name === selectedTool) : tools[0];
  
  return (
    <Layout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Back button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
              <Link to="/connectors" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Connectors
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Return to the connectors catalog</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Connector Header */}
        <div className="connector-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <ConnectorIcon 
              slug={connectorData.slug} 
              name={connectorData.name}
              className="h-16 w-16"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{connectorData.name}</h1>
                <StatusBadge status={status} />
              </div>
              <p className="text-muted-foreground mb-4">{connectorData.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5 cursor-default">
                      <Code2 className="h-4 w-4" />
                      {tools.length} tools
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tools.length} executable tools discovered from this connector</p>
                  </TooltipContent>
                </Tooltip>
                {connection?.last_used_at && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5 cursor-default">
                        <Clock className="h-4 w-4" />
                        Last used {new Date(connection.last_used_at).toLocaleDateString()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Most recent tool execution on this connector</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="capitalize cursor-default">{connectorData.auth_type} auth</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Authentication method: {connectorData.auth_type === 'oauth' ? 'OAuth 2.0 + PKCE' : connectorData.auth_type === 'api_key' ? 'API Key' : 'No authentication required'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Configure
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Modify connector settings and permissions</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleDisconnect}
                        disabled={connectingState === 'disconnecting'}
                      >
                        {connectingState === 'disconnecting' ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Revoke access tokens and disconnect this service</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="glow" 
                      className="gap-2"
                      onClick={handleConnect}
                      disabled={connectingState === 'connecting'}
                    >
                      {connectingState === 'connecting' ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plug2 className="h-4 w-4" />
                      )}
                      Connect
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start the OAuth flow to connect to {connectorData.name}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="tools" className="gap-2">
                  <Code2 className="h-4 w-4" />
                  Tools ({tools.length})
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Browse and execute available tools for this connector</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="jobs" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Jobs ({connectorJobs.length})
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>View past tool executions and their results</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
          
          <TabsContent value="tools">
            {isConnected ? (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Tool List */}
                <div className="lg:col-span-1 space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Available Tools</h3>
                  {tools.map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedTool(tool.name)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            activeTool?.name === tool.name
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          <div className="font-mono text-sm text-foreground">{tool.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tool.description}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>{tool.description || 'Click to configure and execute this tool'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                
                {/* Tool Executor */}
                <div className="lg:col-span-2">
                  {activeTool ? (
                    <div className="connector-card p-6">
                      <div className="mb-6">
                        <h3 className="font-mono text-lg text-foreground mb-1">{activeTool.name}</h3>
                        <p className="text-sm text-muted-foreground">{activeTool.description}</p>
                      </div>
                      <ToolExecutor
                        tool={{
                          id: activeTool.id,
                          name: activeTool.name,
                          description: activeTool.description || '',
                          source: activeTool.source,
                          connectorId: activeTool.connector_id,
                          createdAt: activeTool.created_at,
                          schema: (activeTool.schema as unknown as ToolSchema) ?? { type: 'object', properties: {} },
                        }}
                        onExecute={(args) => handleExecuteTool(activeTool.name, args)}
                        isExecuting={executingTool === activeTool.name}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      Select a tool to execute
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 connector-card">
                <Plug2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Connect to access tools</h3>
                <p className="text-muted-foreground mb-6">
                  Connect to {connectorData.name} to discover and execute available tools.
                </p>
                <Button variant="glow" onClick={handleConnect} disabled={connectingState === 'connecting'}>
                  {connectingState === 'connecting' ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plug2 className="h-4 w-4 mr-2" />
                  )}
                  Connect Now
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="jobs">
            <div className="space-y-4">
              {connectorJobs.length > 0 ? (
                connectorJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    connector={{ slug: connectorData.slug, name: connectorData.name }}
                  />
                ))
              ) : (
                <div className="text-center py-16 connector-card">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No jobs yet</h3>
                  <p className="text-muted-foreground">
                    Execute a tool to see job history.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
