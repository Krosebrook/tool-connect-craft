import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HealthAlertRequest {
  connectorName: string;
  connectorSlug: string;
  status: "unhealthy" | "degraded";
  error?: string;
  latencyMs?: number;
  timestamp: string;
  recipientEmail?: string;
}

interface AlertHistoryEntry {
  connectorSlug: string;
  lastAlertAt: number;
  status: string;
}

// In-memory alert history to prevent spam (resets on cold start)
const alertHistory = new Map<string, AlertHistoryEntry>();
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between alerts for same connector

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

function shouldSendAlert(connectorSlug: string, status: string): boolean {
  const existing = alertHistory.get(connectorSlug);
  const now = Date.now();

  if (!existing) {
    return true;
  }

  // Send if status changed or cooldown expired
  if (existing.status !== status || now - existing.lastAlertAt > ALERT_COOLDOWN_MS) {
    return true;
  }

  return false;
}

function recordAlert(connectorSlug: string, status: string): void {
  alertHistory.set(connectorSlug, {
    connectorSlug,
    lastAlertAt: Date.now(),
    status,
  });
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "unhealthy":
      return "🔴";
    case "degraded":
      return "🟡";
    default:
      return "⚪";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "unhealthy":
      return "#dc2626";
    case "degraded":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const resend = new Resend(resendApiKey);

  try {
    const body: HealthAlertRequest | HealthAlertRequest[] = await req.json();
    const alerts = Array.isArray(body) ? body : [body];
    const results: { connectorSlug: string; sent: boolean; reason?: string }[] = [];

    // Default recipient - in production this would come from user preferences
    const defaultRecipient = Deno.env.get("ALERT_RECIPIENT_EMAIL") || "admin@example.com";

    for (const alert of alerts) {
      const {
        connectorName,
        connectorSlug,
        status,
        error,
        latencyMs,
        timestamp,
        recipientEmail,
      } = alert;

      // Check cooldown
      if (!shouldSendAlert(connectorSlug, status)) {
        console.log(`Skipping alert for ${connectorSlug} - cooldown active`);
        results.push({ connectorSlug, sent: false, reason: "cooldown" });
        continue;
      }

      const recipient = recipientEmail || defaultRecipient;
      const statusEmoji = getStatusEmoji(status);
      const statusColor = getStatusColor(status);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
              ${statusEmoji} Connector Health Alert
            </h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${statusColor};">
            <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">
              ${connectorName}
            </h2>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                ${status}
              </span>
            </div>
            ${error ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-top: 12px;">
                <strong style="color: #991b1b;">Error:</strong>
                <p style="margin: 4px 0 0 0; color: #7f1d1d; font-family: monospace; font-size: 13px;">${error}</p>
              </div>
            ` : ''}
            ${latencyMs !== undefined ? `
              <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">
                <strong>Latency:</strong> ${latencyMs}ms
              </p>
            ` : ''}
          </div>
          
          <div style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <p style="margin: 0;">
              Alert generated at: ${new Date(timestamp).toLocaleString()}
            </p>
            <p style="margin: 8px 0 0 0;">
              This is an automated alert from MCP Connector Hub health monitoring.
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        const { error: sendError } = await resend.emails.send({
          from: "MCP Connector Hub <alerts@resend.dev>",
          to: [recipient],
          subject: `${statusEmoji} ${connectorName} is ${status}`,
          html: emailHtml,
        });

        if (sendError) {
          console.error(`Failed to send alert for ${connectorSlug}:`, sendError);
          results.push({ connectorSlug, sent: false, reason: sendError.message });
        } else {
          console.log(`Alert sent for ${connectorSlug} to ${recipient}`);
          recordAlert(connectorSlug, status);
          results.push({ connectorSlug, sent: true });
        }
      } catch (emailError) {
        console.error(`Email send error for ${connectorSlug}:`, emailError);
        results.push({
          connectorSlug,
          sent: false,
          reason: emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    const sentCount = results.filter((r) => r.sent).length;
    const skippedCount = results.filter((r) => !r.sent).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        skipped: skippedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Health alert error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send health alert",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
