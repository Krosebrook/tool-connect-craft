import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Webhook, Plus, Trash2, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WebhookDeliveryHistory } from '@/components/webhooks/WebhookDeliveryHistory';
import { TestWebhookButton } from '@/components/webhooks/TestWebhookButton';
import { DeliveryStatsChart } from '@/components/webhooks/DeliveryStatsChart';
import { WebhookFormDialog } from '@/components/webhooks/WebhookFormDialog';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  created_at: string;
  payload_template: unknown;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status: string;
  response_code: number | null;
  response_body: string | null;
  attempts: number;
  payload: Record<string, unknown>;
  created_at: string;
  delivered_at: string | null;
}

const INTERNAL_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function WebhooksPage() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);

  const fetchWebhooks = async () => {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', INTERNAL_USER_ID)
      .order('created_at', { ascending: false });

    if (error) { console.error('Error fetching webhooks:', error); return; }
    setWebhooks(data || []);
  };

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) { console.error('Error fetching deliveries:', error); return; }
    const typedDeliveries = (data || []).map(d => ({
      ...d,
      payload: (d.payload as Record<string, unknown>) || {},
    }));
    setDeliveries(typedDeliveries);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebhooks();
    fetchDeliveries();
    const channel = supabase
      .channel('webhooks-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webhook_deliveries' }, () => fetchDeliveries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleFormSubmit = async (data: { name: string; url: string; secret: string; events: string[]; payloadTemplate: string }) => {
    if (!data.name || !data.url || data.events.length === 0) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields and select at least one event', variant: 'destructive' });
      return;
    }

    const record: Record<string, unknown> = {
      name: data.name,
      url: data.url,
      secret: data.secret || null,
      events: data.events,
      payload_template: data.payloadTemplate ? JSON.parse(data.payloadTemplate) : null,
    };

    if (editingWebhook) {
      const { error } = await supabase.from('webhooks').update(record as any).eq('id', editingWebhook.id);
      if (error) { toast({ title: 'Error', description: 'Failed to update webhook', variant: 'destructive' }); return; }
      toast({ title: 'Webhook Updated', description: `${data.name} has been updated` });
    } else {
      const { error } = await supabase.from('webhooks').insert({ ...record, user_id: INTERNAL_USER_ID, is_active: true } as any);
      if (error) { toast({ title: 'Error', description: 'Failed to create webhook', variant: 'destructive' }); return; }
      toast({ title: 'Webhook Created', description: `${data.name} has been configured` });
    }

    setDialogOpen(false);
    setEditingWebhook(null);
    fetchWebhooks();
  };

  const openCreate = () => { setEditingWebhook(null); setDialogOpen(true); };
  const openEdit = (webhook: WebhookConfig) => { setEditingWebhook(webhook); setDialogOpen(true); };

  const toggleWebhook = async (webhook: WebhookConfig) => {
    const { error } = await supabase.from('webhooks').update({ is_active: !webhook.is_active }).eq('id', webhook.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update webhook', variant: 'destructive' }); return; }
    fetchWebhooks();
  };

  const deleteWebhook = async (webhook: WebhookConfig) => {
    const { error } = await supabase.from('webhooks').delete().eq('id', webhook.id);
    if (error) { toast({ title: 'Error', description: 'Failed to delete webhook', variant: 'destructive' }); return; }
    toast({ title: 'Webhook Deleted', description: `${webhook.name} has been removed` });
    fetchWebhooks();
  };

  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
  const failedCount = deliveries.filter(d => d.status === 'failed').length;

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Webhooks</h1>
            <p className="text-muted-foreground">Configure webhooks to notify external systems of connection events.</p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        <WebhookFormDialog
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingWebhook(null); }}
          onSubmit={handleFormSubmit}
          webhook={editingWebhook}
        />

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

        <DeliveryStatsChart deliveries={deliveries} />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Configured Webhooks
            </CardTitle>
            <CardDescription>Manage your webhook endpoints and their event subscriptions</CardDescription>
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
                            <Badge key={event} variant="outline" className="text-xs">{event.split('.')[1]}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'} className={webhook.is_active ? 'bg-success/20 text-success' : ''}>
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <TestWebhookButton webhook={webhook} />
                          <Button variant="ghost" size="icon" onClick={() => openEdit(webhook)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch checked={webhook.is_active} onCheckedChange={() => toggleWebhook(webhook)} />
                          <Button variant="ghost" size="icon" onClick={() => deleteWebhook(webhook)}>
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

        <WebhookDeliveryHistory deliveries={deliveries} webhooks={webhooks} loading={loading} onRefresh={fetchDeliveries} />
      </div>
    </Layout>
  );
}
