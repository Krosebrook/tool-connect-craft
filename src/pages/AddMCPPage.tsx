import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Search, Plus, Loader2, CheckCircle2, Server, Lock, Unlock } from 'lucide-react';

interface DiscoveredTool {
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

type AuthMethod = 'none' | 'api_key' | 'bearer';

export default function AddMCPPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('none');
  const [authToken, setAuthToken] = useState('');
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredTool[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasDiscovered, setHasDiscovered] = useState(false);

  const canDiscover = serverUrl.trim().length > 0;
  const canRegister = name.trim().length > 0 && serverUrl.trim().length > 0 && hasDiscovered;

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setDiscoveredTools([]);
    setHasDiscovered(false);

    try {
      const { data, error } = await supabase.functions.invoke('discover-mcp-tools', {
        body: {
          server_url: serverUrl.trim(),
          auth_method: authMethod,
          auth_token: authMethod !== 'none' ? authToken : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const tools: DiscoveredTool[] = data?.tools || [];
      setDiscoveredTools(tools);
      setHasDiscovered(true);

      toast({
        title: 'Tools discovered',
        description: `Found ${tools.length} tool${tools.length !== 1 ? 's' : ''} on this MCP server.`,
      });
    } catch (err) {
      toast({
        title: 'Discovery failed',
        description: err instanceof Error ? err.message : 'Could not reach MCP server.',
        variant: 'destructive',
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);

    try {
      // Generate a slug from the name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `mcp-${Date.now()}`;

      // Insert connector
      const { data: connector, error: connectorError } = await supabase
        .from('connectors')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          auth_type: authMethod === 'none' ? 'none' : 'api_key',
          mcp_server_url: serverUrl.trim(),
          category: 'mcp',
          is_active: true,
        })
        .select()
        .single();

      if (connectorError) throw connectorError;

      // Insert discovered tools
      if (discoveredTools.length > 0) {
        const toolRows = discoveredTools.map((tool) => ({
          connector_id: connector.id,
          name: tool.name,
          description: tool.description || null,
          schema: tool.schema as unknown as import('@/integrations/supabase/types').Json,
          source: 'mcp' as const,
        }));

        const { error: toolsError } = await supabase
          .from('connector_tools')
          .insert(toolRows);

        if (toolsError) throw toolsError;
      }

      toast({
        title: 'MCP server registered',
        description: `${name} with ${discoveredTools.length} tools is now available.`,
      });

      navigate(`/connectors/${slug}`);
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Could not register MCP server.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Register MCP Server</h1>
          <p className="text-muted-foreground">
            Connect any MCP-compatible server to auto-discover its tools and make them available to your team.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Server Details */}
          <div className="connector-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Server Details</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Internal Analytics MCP"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this MCP server provides..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-url">MCP Server URL *</Label>
              <Input
                id="server-url"
                placeholder="https://your-mcp-server.example.com/mcp"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                The HTTP endpoint that accepts MCP JSON-RPC requests.
              </p>
            </div>
          </div>

          {/* Authentication */}
          <div className="connector-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              {authMethod === 'none' ? (
                <Unlock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
              <h2 className="text-lg font-semibold text-foreground">Authentication</h2>
            </div>

            <div className="space-y-2">
              <Label>Auth Method</Label>
              <Select value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (public)</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authMethod !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="auth-token">
                  {authMethod === 'api_key' ? 'API Key' : 'Bearer Token'}
                </Label>
                <Input
                  id="auth-token"
                  type="password"
                  placeholder={authMethod === 'api_key' ? 'sk-...' : 'eyJ...'}
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Sent as an Authorization: Bearer header to the MCP server.
                </p>
              </div>
            )}
          </div>

          {/* Discover Button */}
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="glow"
                  size="lg"
                  className="gap-2"
                  onClick={handleDiscover}
                  disabled={!canDiscover || isDiscovering}
                >
                  {isDiscovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isDiscovering ? 'Discovering...' : 'Discover Tools'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send a tools/list request to the MCP server to discover available tools</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Discovered Tools */}
          {hasDiscovered && (
            <div className="connector-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Discovered Tools ({discoveredTools.length})
                  </h2>
                </div>
              </div>

              {discoveredTools.length > 0 ? (
                <div className="space-y-3">
                  {discoveredTools.map((tool) => (
                    <div
                      key={tool.name}
                      className="rounded-lg border border-border p-4 bg-card"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-foreground">{tool.name}</span>
                        <Badge variant="secondary" className="text-xs">mcp</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tool.description || 'No description provided'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Server responded but no tools were found.
                </p>
              )}
            </div>
          )}

          {/* Register Button */}
          {hasDiscovered && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" asChild>
                <Link to="/connectors">Cancel</Link>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="glow"
                    className="gap-2"
                    onClick={handleRegister}
                    disabled={!canRegister || isRegistering}
                  >
                    {isRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isRegistering ? 'Registering...' : 'Register MCP Server'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save this MCP server and its tools to the connector catalog</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
