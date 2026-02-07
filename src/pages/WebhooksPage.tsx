import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status: string;
  response_code: number | null;
  attempts: number;
  created_at: string;
  delivered_at: string | null;
}

const AVAILABLE_EVENTS = [
  { id: 'connection.active', label: 'Connection Activated', description: 'When a connection becomes active' },
  { id: 'connection.expired', label: 'Connection Expired', description: 'When a connection token expires' },
  { id: 'connection.revoked', label: 'Connection Revoked', description: 'When a connection is manually revoked' },
  { id: 'connection.error', label: 'Connection Error', description: 'When a connection enters error state' },
  { id: 'token.refreshed', label: 'Token Refreshed', description: 'When a token is automatically refreshed' },
];

// Internal user ID for this internal app
const INTERNAL_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function WebhooksPage() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);

  const fetchWebhooks = async () => {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', INTERNAL_USER_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return;
    }

    setWebhooks(data || []);
  };

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching deliveries:', error);
      return;
    }

    setDeliveries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebhooks();
    fetchDeliveries();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('webhooks-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'webhook_deliveries' },
        () => fetchDeliveries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormSecret('');
    setFormEvents([]);
  };

  const createWebhook = async () => {
    if (!formName || !formUrl || formEvents.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one event',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('webhooks')
      .insert({
        user_id: INTERNAL_USER_ID,
        name: formName,
        url: formUrl,
        secret: formSecret || null,
        events: formEvents,
        is_active: true,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Webhook Created',
      description: `${formName} has been configured`,
    });

    resetForm();
    setDialogOpen(false);
    fetchWebhooks();
  };

  const toggleWebhook = async (webhook: WebhookConfig) => {
    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: !webhook.is_active })
      .eq('id', webhook.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
      return;
    }

    fetchWebhooks();
  };

  const deleteWebhook = async (webhook: WebhookConfig) => {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhook.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Webhook Deleted',
      description: `${webhook.name} has been removed`,
    });

    fetchWebhooks();
  };

  const toggleEvent = (eventId: string) => {
    setFormEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
  const failedCount = deliveries.filter(d => d.status === 'failed').length;

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Webhooks</h1>
            <p className="text-muted-foreground">
              Configure webhooks to notify external systems of connection events.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Configure a new webhook endpoint to receive connection events.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Webhook"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://api.example.com/webhooks"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret">
                    Secret (optional)
                    <span className="text-muted-foreground text-xs ml-2">
                      Used for HMAC signature verification
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="secret"
                      type={showSecret ? 'text' : 'password'}
                      placeholder="whsec_..."
                      value={formSecret}
                      onChange={(e) => setFormSecret(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Events</Label>
                  <div className="space-y-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <div 
                        key={event.id} 
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={event.id}
                          checked={formEvents.includes(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={event.id} className="cursor-pointer">
                            {event.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createWebhook}>
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Webhooks</p>
                  <p className="text-2xl font-bold">{webhooks.filter(w => w.is_active).length}</p>
                </div>
                <Webhook className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold text-success">{deliveredCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-destructive">{failedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhooks List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Configured Webhooks
            </CardTitle>
            <CardDescription>
              Manage your webhook endpoints and their event subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No webhooks configured</p>
                <p className="text-sm">Create a webhook to start receiving events</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {webhook.url.substring(0, 40)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event.split('.')[1]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={webhook.is_active ? 'default' : 'secondary'}
                          className={webhook.is_active ? 'bg-success/20 text-success' : ''}
                        >
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={webhook.is_active}
                            onCheckedChange={() => toggleWebhook(webhook)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWebhook(webhook)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Recent Deliveries
                </CardTitle>
                <CardDescription>
                  Recent webhook delivery attempts and their status
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDeliveries}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading deliveries...
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No deliveries yet</p>
                <p className="text-sm">Deliveries will appear here when events are triggered</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Badge variant="outline">{delivery.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.status === 'delivered' ? (
                          <Badge className="bg-success/20 text-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Delivered
                          </Badge>
                        ) : delivery.status === 'failed' ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {delivery.response_code && (
                          <code className="text-xs">{delivery.response_code}</code>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
