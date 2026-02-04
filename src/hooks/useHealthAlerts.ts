import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthResult {
  connector: string;
  slug: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  error?: string;
  latencyMs?: number;
}

interface SendAlertOptions {
  recipientEmail?: string;
}

/**
 * Hook to send email alerts for unhealthy connectors.
 */
export function useHealthAlerts() {
  const { toast } = useToast();

  const sendHealthAlerts = useCallback(async (
    unhealthyResults: HealthResult[],
    options?: SendAlertOptions
  ) => {
    if (unhealthyResults.length === 0) {
      return { success: true, sent: 0 };
    }

    // Only send alerts for unhealthy or degraded connectors
    const alertableResults = unhealthyResults.filter(
      r => r.status === 'unhealthy' || r.status === 'degraded'
    );

    if (alertableResults.length === 0) {
      return { success: true, sent: 0 };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-health-alert', {
        body: alertableResults.map(result => ({
          connectorName: result.connector,
          connectorSlug: result.slug,
          status: result.status,
          error: result.error,
          latencyMs: result.latencyMs,
          timestamp: new Date().toISOString(),
          recipientEmail: options?.recipientEmail,
        })),
      });

      if (error) {
        console.error('Failed to send health alerts:', error);
        toast({
          title: 'Alert Failed',
          description: 'Could not send health alert emails.',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      if (data?.sent > 0) {
        toast({
          title: 'Alerts Sent',
          description: `Sent ${data.sent} health alert email(s).`,
        });
      }

      return { success: true, sent: data?.sent || 0, results: data?.results };
    } catch (err) {
      console.error('Health alert error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }, [toast]);

  const triggerManualAlert = useCallback(async (
    connectorName: string,
    connectorSlug: string,
    status: 'unhealthy' | 'degraded',
    error?: string,
    recipientEmail?: string
  ) => {
    return sendHealthAlerts([{
      connector: connectorName,
      slug: connectorSlug,
      status,
      error,
    }], { recipientEmail });
  }, [sendHealthAlerts]);

  return {
    sendHealthAlerts,
    triggerManualAlert,
  };
}
