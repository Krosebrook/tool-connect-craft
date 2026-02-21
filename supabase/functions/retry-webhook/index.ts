import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === supabaseServiceKey;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { deliveryId } = await req.json();

    if (!deliveryId) {
      return new Response(
        JSON.stringify({ error: 'deliveryId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('webhook_deliveries')
      .select('*, webhooks(*)')
      .eq('id', deliveryId)
      .single();

    if (deliveryError || !delivery) {
      return new Response(
        JSON.stringify({ error: 'Delivery not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhook = delivery.webhooks;
    if (!webhook) {
      return new Response(
        JSON.stringify({ error: 'Associated webhook not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = delivery.payload;

    // Reset delivery status to pending
    await supabase
      .from('webhook_deliveries')
      .update({ status: 'pending', response_code: null, response_body: null, delivered_at: null, attempts: 0 })
      .eq('id', deliveryId);

    // Send with retry
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;
    let lastBody: string | undefined;
    let finalAttempts = 0;
    let success = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      finalAttempts = attempt;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'Lovable-Webhooks/1.0',
          'X-Webhook-Attempt': attempt.toString(),
          'X-Webhook-Retry': 'true',
        };

        if (webhook.secret) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw', encoder.encode(webhook.secret),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
          );
          const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)));
          const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
          headers['X-Webhook-Signature'] = `sha256=${hex}`;
        }

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const body = await response.text();
        lastStatusCode = response.status;
        lastBody = body.substring(0, 1000);

        if (response.ok) {
          success = true;
          break;
        }

        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          lastError = `HTTP ${response.status}`;
          break;
        }

        lastError = `HTTP ${response.status}: ${body.substring(0, 200)}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }

    // Update delivery record
    await supabase
      .from('webhook_deliveries')
      .update({
        status: success ? 'delivered' : 'failed',
        response_code: lastStatusCode ?? null,
        response_body: lastBody || lastError || null,
        attempts: finalAttempts,
        delivered_at: success ? new Date().toISOString() : null,
      })
      .eq('id', deliveryId);

    return new Response(
      JSON.stringify({ success, attempts: finalAttempts, statusCode: lastStatusCode, error: lastError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Retry webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retry webhook delivery' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
