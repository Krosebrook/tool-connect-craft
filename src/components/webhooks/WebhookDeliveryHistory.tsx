import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  RotateCcw,
  Timer,
  Hash
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

interface WebhookConfig {
  id: string;
  name: string;
}

interface WebhookDeliveryHistoryProps {
  deliveries: WebhookDelivery[];
  webhooks: WebhookConfig[];
  loading: boolean;
  onRefresh: () => void;
}

export function WebhookDeliveryHistory({ 
  deliveries, 
  webhooks, 
  loading, 
  onRefresh 
}: WebhookDeliveryHistoryProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getWebhookName = (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    return webhook?.name || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getResponseCodeBadge = (code: number | null) => {
    if (!code) return <span className="text-muted-foreground">—</span>;
    
    const isSuccess = code >= 200 && code < 300;
    const isClientError = code >= 400 && code < 500;
    const isServerError = code >= 500;
    
    return (
      <Badge 
        variant="outline" 
        className={
          isSuccess ? 'bg-success/10 text-success border-success/30' :
          isClientError ? 'bg-warning/10 text-warning border-warning/30' :
          isServerError ? 'bg-destructive/10 text-destructive border-destructive/30' :
          ''
        }
      >
        {code}
      </Badge>
    );
  };

  const getRetryTiming = (attempts: number) => {
    if (attempts <= 1) return null;
    
    // Exponential backoff: 1s, 2s, 4s
    const totalDelay = attempts === 2 ? 1 : attempts === 3 ? 3 : 0;
    
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Timer className="h-3 w-3" />
        ~{totalDelay}s delay
      </span>
    );
  };

  const viewDetails = (delivery: WebhookDelivery) => {
    setSelectedDelivery(delivery);
    setDetailsOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Delivery History
              </CardTitle>
              <CardDescription>
                Detailed webhook delivery attempts with retry information
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
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
                  <TableHead>Webhook</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Attempts
                    </div>
                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">
                      {getWebhookName(delivery.webhook_id)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{delivery.event_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                    <TableCell>{getResponseCodeBadge(delivery.response_code)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className={delivery.attempts > 1 ? 'text-warning font-medium' : ''}>
                            {delivery.attempts}
                          </span>
                        </div>
                        {getRetryTiming(delivery.attempts)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                        </span>
                        {delivery.delivered_at && (
                          <span className="text-xs text-muted-foreground">
                            Delivered: {format(new Date(delivery.delivered_at), 'HH:mm:ss')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewDetails(delivery)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Delivery Details
            </DialogTitle>
            <DialogDescription>
              Full details of the webhook delivery attempt
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Webhook</p>
                    <p className="font-medium">{getWebhookName(selectedDelivery.webhook_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Type</p>
                    <Badge variant="outline">{selectedDelivery.event_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedDelivery.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Code</p>
                    {getResponseCodeBadge(selectedDelivery.response_code)}
                  </div>
                </div>

                {/* Timing Information */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Timing & Retries
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{format(new Date(selectedDelivery.created_at), 'PPpp')}</p>
                    </div>
                    {selectedDelivery.delivered_at && (
                      <div>
                        <p className="text-muted-foreground">Delivered</p>
                        <p>{format(new Date(selectedDelivery.delivered_at), 'PPpp')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Total Attempts</p>
                      <p className="flex items-center gap-2">
                        <span className={selectedDelivery.attempts > 1 ? 'text-warning font-medium' : ''}>
                          {selectedDelivery.attempts}
                        </span>
                        {selectedDelivery.attempts > 1 && (
                          <span className="text-xs text-muted-foreground">
                            (with exponential backoff)
                          </span>
                        )}
                      </p>
                    </div>
                    {selectedDelivery.attempts > 1 && (
                      <div>
                        <p className="text-muted-foreground">Retry Delays</p>
                        <p className="text-xs">
                          {Array.from({ length: selectedDelivery.attempts - 1 }, (_, i) => 
                            `${Math.pow(2, i)}s`
                          ).join(' → ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payload */}
                <div>
                  <h4 className="font-medium mb-2">Payload</h4>
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                    {JSON.stringify(selectedDelivery.payload, null, 2)}
                  </pre>
                </div>

                {/* Response Body */}
                {selectedDelivery.response_body && (
                  <div>
                    <h4 className="font-medium mb-2">Response Body</h4>
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto max-h-40">
                      {selectedDelivery.response_body}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
