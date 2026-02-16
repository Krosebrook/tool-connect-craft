import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectorIcon } from '@/components/connectors/ConnectorIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConnectors } from '@/context/ConnectorContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Download,
  Check,
  Star,
  Code2,
  BookOpen,
  Settings2,
  Copy,
  CheckCheck,
  Shield,
  Zap,
  ExternalLink,
} from 'lucide-react';

// Import the same registry used by MarketplacePage
import { MARKETPLACE_CONNECTORS } from '@/pages/MarketplacePage';

// Usage example templates per tool pattern
function generateUsageExample(connectorSlug: string, tool: { name: string; schema: Record<string, unknown> }): string {
  const schema = tool.schema as { properties?: Record<string, { type?: string; description?: string; default?: unknown }>; required?: string[] };
  const props = schema.properties || {};
  const required = schema.required || [];

  const args: Record<string, string> = {};
  for (const [key, val] of Object.entries(props)) {
    if (val.type === 'string') args[key] = required.includes(key) ? `"your_${key}"` : `"optional_${key}"`;
    else if (val.type === 'number') args[key] = String(val.default ?? 10);
    else if (val.type === 'boolean') args[key] = 'true';
    else if (val.type === 'array') args[key] = '[]';
    else if (val.type === 'object') args[key] = '{}';
  }

  const argStr = Object.entries(args).map(([k, v]) => `  "${k}": ${v}`).join(',\n');

  return `// Execute via MCP or REST
POST /api/tools/${connectorSlug}/${tool.name}

{
${argStr}
}`;
}

function getSetupSteps(authType: string, name: string): { title: string; description: string }[] {
  if (authType === 'oauth') {
    return [
      { title: 'Install from Marketplace', description: `Click "Install" to add ${name} to your connector registry.` },
      { title: 'Connect your account', description: `Navigate to Connectors → ${name} and click "Connect". You'll be redirected to authorize access via OAuth.` },
      { title: 'Grant permissions', description: 'Review the requested scopes and approve access. Your tokens are stored securely and auto-refreshed.' },
      { title: 'Start using tools', description: 'All tools become available immediately via your MCP endpoint or the tool executor UI.' },
    ];
  }
  return [
    { title: 'Install from Marketplace', description: `Click "Install" to add ${name} to your connector registry.` },
    { title: 'Get your API key', description: `Log into your ${name} account and generate an API key from the developer settings.` },
    { title: 'Connect with API key', description: `Navigate to Connectors → ${name} and enter your API key to authenticate.` },
    { title: 'Start using tools', description: 'All tools become available immediately via your MCP endpoint or the tool executor UI.' },
  ];
}

export default function MarketplaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { connectors } = useConnectors();
  const { toast } = useToast();
  const [installing, setInstalling] = useState(false);
  const [copiedTool, setCopiedTool] = useState<string | null>(null);

  const connector = MARKETPLACE_CONNECTORS.find(c => c.slug === slug);
  const isInstalled = connectors.some(c => c.slug === slug);

  const handleCopy = useCallback((text: string, toolName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTool(toolName);
    setTimeout(() => setCopiedTool(null), 2000);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!connector) return;
    setInstalling(true);
    try {
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

      if (newConnector && connector.tools.length > 0) {
        const toolRows = connector.tools.map(t => ({
          connector_id: newConnector.id,
          name: t.name,
          description: t.description,
          schema: t.schema as unknown as import('@/integrations/supabase/types').Json,
          source: 'rest' as const,
        }));

        await supabase
          .from('connector_tools')
          .upsert(toolRows, { onConflict: 'connector_id,name', ignoreDuplicates: true });
      }

      toast({
        title: `${connector.name} installed!`,
        description: `${connector.toolCount} tools are now available.`,
      });

      window.location.reload();
    } catch (err: any) {
      toast({
        title: 'Installation failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setInstalling(false);
    }
  }, [connector, toast]);

  if (!connector) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Connector not found</h1>
          <Button asChild variant="outline">
            <Link to="/marketplace" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const setupSteps = getSetupSteps(connector.authType, connector.name);

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Back */}
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/marketplace" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>

        {/* Header */}
        <div className="connector-card p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <ConnectorIcon slug={connector.slug} name={connector.name} className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{connector.name}</h1>
                {isInstalled && (
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                    <Check className="h-3 w-3" /> Installed
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{connector.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Code2 className="h-4 w-4" /> {connector.toolCount} tools
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {connector.popularity}/5
                </span>
                <Badge variant="outline" className="text-xs font-normal">{connector.category}</Badge>
                <span className="capitalize flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> {connector.authType === 'oauth' ? 'OAuth 2.0' : connector.authType === 'api_key' ? 'API Key' : 'None'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {connector.tags.map(tag => (
                  <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              {isInstalled ? (
                <Button asChild variant="outline" className="gap-2">
                  <Link to={`/connectors/${connector.slug}`}>
                    <ExternalLink className="h-4 w-4" /> View Connector
                  </Link>
                </Button>
              ) : (
                <Button variant="glow" className="gap-2" disabled={installing} onClick={handleInstall}>
                  {installing ? 'Installing...' : <><Download className="h-4 w-4" /> Install Now</>}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tools" className="gap-2">
              <Code2 className="h-4 w-4" /> Tools ({connector.toolCount})
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Settings2 className="h-4 w-4" /> Setup Guide
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-2">
              <BookOpen className="h-4 w-4" /> Usage Examples
            </TabsTrigger>
          </TabsList>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            {connector.tools.map(tool => {
              const schema = tool.schema as { properties?: Record<string, { type?: string; description?: string; default?: unknown; enum?: string[] }>; required?: string[] };
              const props = schema.properties || {};
              const required = schema.required || [];

              return (
                <Card key={tool.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {tool.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">REST</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(props).length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Parameter</th>
                              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Required</th>
                              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(props).map(([paramName, paramDef]) => (
                              <tr key={paramName} className="border-b last:border-0">
                                <td className="px-4 py-2 font-mono text-xs text-foreground">{paramName}</td>
                                <td className="px-4 py-2">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {paramDef.type || 'string'}
                                  </Badge>
                                  {paramDef.enum && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      [{paramDef.enum.join(', ')}]
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2">
                                  {required.includes(paramName) ? (
                                    <Badge className="text-xs bg-destructive/10 text-destructive border-0">Required</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Optional</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-xs text-muted-foreground">
                                  {paramDef.description || '—'}
                                  {paramDef.default !== undefined && (
                                    <span className="ml-1 text-foreground/60">(default: {String(paramDef.default)})</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No parameters required</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Instructions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Follow these steps to get {connector.name} up and running.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {setupSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="pt-0.5">
                      <h4 className="font-medium text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {connector.authType === 'oauth' && connector.oauthScopes && connector.oauthScopes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Required Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {connector.oauthScopes.map(scope => (
                      <Badge key={scope} variant="outline" className="font-mono text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    These scopes are requested during the OAuth flow. You can review and modify them in connector settings.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Usage Examples Tab */}
          <TabsContent value="examples" className="space-y-4">
            {connector.tools.map(tool => {
              const example = generateUsageExample(connector.slug, tool);
              return (
                <Card key={tool.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">{tool.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => handleCopy(example, tool.name)}
                      >
                        {copiedTool === tool.name ? (
                          <><CheckCheck className="h-3.5 w-3.5" /> Copied</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /> Copy</>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto text-foreground">
                      {example}
                    </pre>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
