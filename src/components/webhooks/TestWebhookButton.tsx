import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
}

interface TestResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  body?: string;
}

interface TestWebhookButtonProps {
  webhook: WebhookConfig;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function TestWebhookButton({ webhook, variant = 'outline', size = 'sm' }: TestWebhookButtonProps) {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const testWebhook = async () => {
    setTesting(true);
    setResult(null);

    const startTime = Date.now();
    
    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Connector Hub',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    try {
      // Call our edge function to send the test webhook
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: {
          url: webhook.url,
          secret: webhook.secret,
          payload: testPayload,
        },
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        setResult({
          success: false,
          error: error.message,
          responseTime,
        });
      } else {
        setResult({
          success: data.success,
          statusCode: data.statusCode,
          responseTime,
          body: data.body?.substring(0, 500),
          error: data.error,
        });
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        responseTime,
      });
    }

    setTesting(false);
  };

  const handleTest = async () => {
    setDialogOpen(true);
    await testWebhook();
  };

  const getStatusIcon = () => {
    if (testing) {
      return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
    }
    if (!result) {
      return <Send className="h-8 w-8 text-muted-foreground" />;
    }
    if (result.success) {
      return <CheckCircle2 className="h-8 w-8 text-success" />;
    }
    return <XCircle className="h-8 w-8 text-destructive" />;
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleTest}
        disabled={!webhook.is_active}
        className="gap-1"
      >
        <Zap className="h-4 w-4" />
        {size !== 'icon' && 'Test'}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Test Webhook
            </DialogTitle>
            <DialogDescription>
              Sending a test ping to {webhook.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex flex-col items-center justify-center gap-4">
              {getStatusIcon()}
              
              {testing && (
                <p className="text-muted-foreground">Sending test payload...</p>
              )}

              {result && (
                <div className="w-full space-y-4">
                  {/* Status Banner */}
                  <div 
                    className={`p-4 rounded-lg ${
                      result.success 
                        ? 'bg-success/10 border border-success/30' 
                        : 'bg-destructive/10 border border-destructive/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={result.success ? 'text-success' : 'text-destructive'}>
                        {result.success ? 'Webhook Reachable' : 'Delivery Failed'}
                      </span>
                      {result.statusCode && (
                        <Badge variant="outline">
                          HTTP {result.statusCode}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Response Time
                      </span>
                      <span className="font-mono">{result.responseTime}ms</span>
                    </div>

                    {result.error && (
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-sm text-destructive">{result.error}</p>
                      </div>
                    )}

                    {result.body && (
                      <div>
                        <p className="text-muted-foreground mb-1">Response Preview</p>
                        <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto max-h-32">
                          {result.body}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            {result && (
              <Button variant="outline" onClick={testWebhook} disabled={testing}>
                <Zap className="h-4 w-4 mr-2" />
                Retry Test
              </Button>
            )}
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
