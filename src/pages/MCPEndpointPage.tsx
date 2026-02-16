import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { supabaseConfig } from '@/lib/config';
import { Copy, Plus, Trash2, Key, Server, Terminal, ExternalLink, Eye, EyeOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function MCPEndpointPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showSnippet, setShowSnippet] = useState<'claude' | 'cursor' | null>(null);

  const mcpEndpointUrl = `${supabaseConfig.url}/functions/v1/mcp-server/mcp`;

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    const { data, error } = await supabase
      .from('mcp_api_keys')
      .select('id, name, key_prefix, last_used_at, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) setApiKeys(data);
    setLoading(false);
  }

  async function generateKey() {
    if (!newKeyName.trim()) {
      toast({ title: 'Enter a name', description: 'Give this key a label like "Claude Desktop"', variant: 'destructive' });
      return;
    }

    setCreating(true);
    const rawKey = `mcp_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not authenticated', description: 'Please sign in first.', variant: 'destructive' });
      setCreating(false);
      return;
    }

    const { error } = await supabase.from('mcp_api_keys').insert({
      user_id: user.id,
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setGeneratedKey(rawKey);
      setNewKeyName('');
      fetchApiKeys();
      toast({ title: 'API key created', description: 'Copy it now — it won\'t be shown again.' });
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    const { error } = await supabase.from('mcp_api_keys').delete().eq('id', id);
    if (!error) {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast({ title: 'Key revoked' });
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  }

  const claudeSnippet = JSON.stringify({
    mcpServers: {
      "mcp-hub": {
        url: mcpEndpointUrl,
        headers: {
          Authorization: "Bearer YOUR_API_KEY"
        }
      }
    }
  }, null, 2);

  const cursorSnippet = JSON.stringify({
    mcpServers: {
      "mcp-hub": {
        url: mcpEndpointUrl,
        headers: {
          Authorization: "Bearer YOUR_API_KEY"
        }
      }
    }
  }, null, 2);

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MCP Endpoint</h1>
          <p className="text-muted-foreground mt-1">
            Connect your AI assistants to all your services through a single MCP URL.
          </p>
        </div>

        {/* Endpoint URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-primary" />
              Your MCP Endpoint
            </CardTitle>
            <CardDescription>
              Paste this URL into your AI client (Claude Desktop, Cursor, ChatGPT, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-3 rounded-lg text-sm font-mono text-foreground break-all">
                {mcpEndpointUrl}
              </code>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(mcpEndpointUrl, 'URL')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Config Snippets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-primary" />
              Quick Setup
            </CardTitle>
            <CardDescription>
              Copy a ready-to-paste configuration snippet for your AI client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={showSnippet === 'claude' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSnippet(showSnippet === 'claude' ? null : 'claude')}
              >
                Claude Desktop
              </Button>
              <Button
                variant={showSnippet === 'cursor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSnippet(showSnippet === 'cursor' ? null : 'cursor')}
              >
                Cursor / VS Code
              </Button>
            </div>
            {showSnippet && (
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm font-mono text-foreground overflow-x-auto">
                  {showSnippet === 'claude' ? claudeSnippet : cursorSnippet}
                </pre>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(showSnippet === 'claude' ? claudeSnippet : cursorSnippet, 'Config')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-primary" />
              API Keys
            </CardTitle>
            <CardDescription>
              Generate keys to authenticate your AI clients. Keys are hashed — only shown once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generated key banner */}
            {generatedKey && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-success">
                  🔑 New API key created — copy it now!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono break-all">
                    {generatedKey}
                  </code>
                  <Button size="sm" onClick={() => copyToClipboard(generatedKey, 'API key')}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setGeneratedKey(null)}>
                  Dismiss
                </Button>
              </div>
            )}

            {/* Create new key */}
            <div className="flex gap-2">
              <Input
                placeholder='Key name (e.g. "Claude Desktop")'
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateKey()}
              />
              <Button onClick={generateKey} disabled={creating}>
                <Plus className="h-4 w-4 mr-1" /> Generate
              </Button>
            </div>

            {/* Key list */}
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading keys...</p>
            ) : apiKeys.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No API keys yet. Generate one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map(key => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{key.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {key.key_prefix}...
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Any AI client using "{key.name}" ({key.key_prefix}...) will lose access immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => revokeKey(key.id)}>Revoke</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
