import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWebhookWithRetry(
  url: string,
  payload: WebhookPayload,
  secret?: string,
  maxRetries: number = MAX_RETRIES
): Promise<{ success: boolean; statusCode?: number; body?: string; error?: string; attempts: number }> {
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;
  let lastBody: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Webhooks/1.0',
        'X-Webhook-Attempt': attempt.toString(),
      };

      // Add HMAC signature if secret is provided
      if (secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(JSON.stringify(payload))
        );
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        headers['X-Webhook-Signature'] = `sha256=${signatureHex}`;
      }

      console.log(`Webhook attempt ${attempt}/${maxRetries} to ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const body = await response.text();
      lastStatusCode = response.status;
      lastBody = body.substring(0, 1000);

      if (response.ok) {
        console.log(`Webhook delivered successfully on attempt ${attempt}`);
        return {
          success: true,
          statusCode: response.status,
          body: lastBody,
          attempts: attempt,
        };
      }

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        console.log(`Webhook failed with client error ${response.status}, not retrying`);
        return {
          success: false,
          statusCode: response.status,
          body: lastBody,
          attempts: attempt,
        };
      }

      lastError = `HTTP ${response.status}: ${body.substring(0, 200)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook attempt ${attempt} failed:`, lastError);
    }

    // Exponential backoff before next retry
    if (attempt < maxRetries) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  console.log(`Webhook failed after ${maxRetries} attempts`);
  return {
    success: false,
    statusCode: lastStatusCode,
    body: lastBody,
    error: lastError,
    attempts: maxRetries,
  };
}

function applyTemplate(template: Record<string, unknown>, variables: Record<string, string>): unknown {
  const json = JSON.stringify(template);
  const result = json.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? '';
  });
  return JSON.parse(result);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event, connectionId, connectorId, userId, status, previousStatus } = await req.json();

    console.log(`Processing webhook for event: ${event}, connection: ${connectionId}`);

    // Get connector details
    const { data: connector } = await supabase
      .from('connectors')
      .select('name, slug')
      .eq('id', connectorId)
      .single();

    // Build payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        connectionId,
        connectorId,
        connectorName: connector?.name || 'Unknown',
        connectorSlug: connector?.slug || 'unknown',
        userId,
        status,
        previousStatus,
      },
    };

    // Get all active webhooks for this user that are subscribed to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [event]);

    // Template variables for substitution
    const templateVars: Record<string, string> = {
      event,
      timestamp: payload.timestamp,
      connectionId: connectionId || '',
      connectorId: connectorId || '',
      connectorName: connector?.name || 'Unknown',
      connectorSlug: connector?.slug || 'unknown',
      userId: userId || '',
      status: status || '',
      previousStatus: previousStatus || '',
    };

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhooks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No webhooks configured for this event');
      return new Response(
        JSON.stringify({ message: 'No webhooks to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending to ${webhooks.length} webhook(s)`);

    // Send webhooks and record deliveries
    const results = await Promise.all(
      webhooks.map(async (webhook) => {
        // Create delivery record
        const { data: delivery, error: deliveryError } = await supabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event_type: event,
            payload,
            status: 'pending',
          })
          .select()
          .single();

        if (deliveryError) {
          console.error('Error creating delivery:', deliveryError);
          return { webhookId: webhook.id, success: false, error: 'Failed to create delivery' };
        }

        // Determine the payload to send: custom template or default
        const webhookPayload = webhook.payload_template
          ? applyTemplate(webhook.payload_template, templateVars)
          : payload;

        // Send the webhook with retry logic
        const result = await sendWebhookWithRetry(webhook.url, webhookPayload as WebhookPayload, webhook.secret);

        // Update delivery record with final status
        await supabase
          .from('webhook_deliveries')
          .update({
            status: result.success ? 'delivered' : 'failed',
            response_code: result.statusCode,
            response_body: result.body || result.error,
            attempts: result.attempts,
            delivered_at: result.success ? new Date().toISOString() : null,
          })
          .eq('id', delivery.id);

        console.log(`Webhook ${webhook.id}: ${result.success ? 'delivered' : 'failed'} after ${result.attempts} attempt(s)`);

        return {
          webhookId: webhook.id,
          deliveryId: delivery.id,
          success: result.success,
          statusCode: result.statusCode,
          attempts: result.attempts,
        };
      })
    );

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount}/${webhooks.length} webhooks`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
