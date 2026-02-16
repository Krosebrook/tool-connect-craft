# Webhooks Guide

Complete reference for the Tool Connect Craft webhook system — covering setup, payload templates, HMAC signature verification, delivery management, and debugging.

---

## Table of Contents

- [Overview](#overview)
- [Webhook Lifecycle](#webhook-lifecycle)
- [Creating Webhooks](#creating-webhooks)
- [Event Types](#event-types)
- [Payload Structure](#payload-structure)
- [Payload Templates](#payload-templates)
- [HMAC Signature Verification](#hmac-signature-verification)
  - [Node.js](#nodejs)
  - [Python](#python)
  - [Go](#go)
  - [Ruby](#ruby)
- [Delivery Management](#delivery-management)
- [Retry Behavior](#retry-behavior)
- [Testing Webhooks](#testing-webhooks)
- [Monitoring & Analytics](#monitoring--analytics)
- [Debugging](#debugging)
- [Security Best Practices](#security-best-practices)

---

## Overview

The webhook system enables external integrations by pushing event notifications to user-defined HTTP endpoints. Key capabilities:

| Feature | Detail |
|---|---|
| **Signing** | HMAC-SHA256 signature on every delivery |
| **Templates** | Custom JSON payload structures with variable interpolation |
| **Retries** | Exponential backoff (1s → 2s → 4s) for failed deliveries |
| **Bulk retry** | One-click retry for all failed deliveries |
| **History** | Full delivery log with response codes and bodies |
| **Analytics** | 7-day delivery performance chart |
| **Testing** | Send test payloads without triggering real events |

### Architecture

```
Event Trigger
    │
    ▼
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│ send-webhook │────▶│ Template Engine   │────▶│ HTTP POST      │
│ Edge Function│     │ (variable interp) │     │ + HMAC Signing │
└──────────────┘     └──────────────────┘     └────────┬───────┘
                                                       │
                                              ┌────────▼───────┐
                                              │ Your Endpoint  │
                                              └────────────────┘
                                                       │
                                              ┌────────▼───────┐
                                              │ webhook_       │
                                              │ deliveries     │
                                              │ (log result)   │
                                              └────────────────┘
```

---

## Webhook Lifecycle

1. **Create** — Register an endpoint URL, select events, optionally set a secret and payload template
2. **Trigger** — When a subscribed event fires, `send-webhook` Edge Function is invoked
3. **Template** — Payload is built from template (or default), variables interpolated
4. **Sign** — HMAC-SHA256 signature computed over the JSON body using your secret
5. **Deliver** — HTTP POST to your endpoint with signature in `X-Webhook-Signature` header
6. **Log** — Response code, body, and timing recorded in `webhook_deliveries`
7. **Retry** — Failed deliveries (non-2xx) retried up to 3 times with exponential backoff

---

## Creating Webhooks

### Via the UI

Navigate to `/webhooks` and click **Create Webhook**. The form accepts:

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | Human-readable identifier |
| **URL** | Yes | HTTPS endpoint that receives POST requests |
| **Events** | Yes | Array of event types to subscribe to |
| **Secret** | No | Shared secret for HMAC signature verification |
| **Payload Template** | No | Custom JSON template with `{{variable}}` placeholders |
| **Active** | Yes | Toggle to enable/disable delivery |

### Database Schema

```sql
-- webhooks table
CREATE TABLE webhooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  events      TEXT[] DEFAULT '{}',
  secret      TEXT,                    -- HMAC signing key
  payload_template JSONB,             -- Custom payload structure
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## Event Types

| Event | Trigger |
|---|---|
| `connection.active` | OAuth connection successfully established |
| `connection.expired` | OAuth token expired |
| `connection.revoked` | User revoked a connection |
| `connection.error` | Connection entered error state |
| `job.queued` | Pipeline job created |
| `job.running` | Pipeline job started execution |
| `job.succeeded` | Pipeline job completed successfully |
| `job.failed` | Pipeline job failed |
| `tool.executed` | Tool execution completed |
| `health.alert` | Health check detected an issue |

Subscribe to multiple events per webhook. A webhook with `["job.succeeded", "job.failed"]` receives notifications for both outcomes.

---

## Payload Structure

### Default Payload

When no custom template is defined, the system sends:

```json
{
  "event": "job.succeeded",
  "timestamp": "2026-02-16T14:30:00.000Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "connectorId": "github",
    "connectorName": "GitHub",
    "status": "succeeded",
    "userId": "00000000-0000-0000-0000-000000000001"
  }
}
```

### Headers

Every delivery includes these headers:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Webhook-Signature` | `sha256=<hex-encoded HMAC>` (if secret is set) |
| `User-Agent` | `ToolConnectCraft/1.0` |

---

## Payload Templates

### Overview

Payload templates let you customize the JSON structure sent to your endpoint. Templates use `{{variable}}` syntax for dynamic values.

### Available Variables

| Variable | Type | Description | Example |
|---|---|---|---|
| `{{event}}` | string | Event type name | `job.succeeded` |
| `{{timestamp}}` | string | ISO 8601 timestamp | `2026-02-16T14:30:00.000Z` |
| `{{connectorId}}` | string | Connector UUID | `550e8400-...` |
| `{{connectorName}}` | string | Human-readable connector name | `GitHub` |
| `{{status}}` | string | Current status | `succeeded` |
| `{{userId}}` | string | User UUID | `00000000-...` |
| `{{id}}` | string | Entity UUID | `550e8400-...` |

### Template Examples

#### Slack Incoming Webhook

```json
{
  "text": "🔔 *{{event}}*: {{connectorName}} — {{status}}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Event:* {{event}}\n*Connector:* {{connectorName}}\n*Status:* {{status}}\n*Time:* {{timestamp}}"
      }
    }
  ]
}
```

#### Discord Webhook

```json
{
  "content": null,
  "embeds": [
    {
      "title": "{{event}}",
      "description": "Connector **{{connectorName}}** changed to **{{status}}**",
      "color": 5814783,
      "timestamp": "{{timestamp}}"
    }
  ]
}
```

#### PagerDuty Event

```json
{
  "routing_key": "YOUR_ROUTING_KEY",
  "event_action": "trigger",
  "payload": {
    "summary": "{{connectorName}}: {{event}} ({{status}})",
    "source": "tool-connect-craft",
    "severity": "warning",
    "timestamp": "{{timestamp}}"
  }
}
```

#### Minimal Payload

```json
{
  "type": "{{event}}",
  "connector": "{{connectorName}}",
  "ok": true
}
```

### Template Engine

The `send-webhook` Edge Function processes templates with regex-based interpolation:

```typescript
// Simplified engine logic
function interpolate(template: object, variables: Record<string, string>): object {
  let json = JSON.stringify(template);
  for (const [key, value] of Object.entries(variables)) {
    json = json.replaceAll(`{{${key}}}`, value);
  }
  return JSON.parse(json);
}
```

If no template is set, the default payload structure is used. Unknown variables remain as literal `{{variableName}}` strings.

---

## HMAC Signature Verification

Every webhook delivery with a configured secret includes an `X-Webhook-Signature` header:

```
X-Webhook-Signature: sha256=a1b2c3d4e5f6...
```

The signature is computed as `HMAC-SHA256(secret, JSON.stringify(body))` and hex-encoded.

**Always verify signatures to ensure:**
- The payload was sent by Tool Connect Craft (authenticity)
- The payload was not modified in transit (integrity)

### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-webhook-signature'];
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSig = signature.slice('sha256='.length);
  const body = JSON.stringify(req.body);
  const computedSig = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig, 'hex'),
    Buffer.from(computedSig, 'hex')
  );
}

// Express middleware
app.post('/webhook', express.json(), (req, res) => {
  if (!verifyWebhookSignature(req, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('Verified event:', req.body.event);
  res.status(200).json({ received: true });
});
```

### Python

```python
import hmac
import hashlib
import json
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "your-webhook-secret"

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    if not signature or not signature.startswith("sha256="):
        return False

    expected = signature[len("sha256="):]
    computed = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, computed)

@app.route("/webhook", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-Webhook-Signature", "")
    payload = request.get_data()

    if not verify_signature(payload, signature, WEBHOOK_SECRET):
        abort(401, "Invalid signature")

    data = request.get_json()
    print(f"Verified event: {data['event']}")
    return {"received": True}, 200
```

### Go

```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

const webhookSecret = "your-webhook-secret"

func verifySignature(body []byte, signature, secret string) bool {
	if !strings.HasPrefix(signature, "sha256=") {
		return false
	}

	expected := strings.TrimPrefix(signature, "sha256=")

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	computed := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(computed))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	signature := r.Header.Get("X-Webhook-Signature")
	if !verifySignature(body, signature, webhookSecret) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var payload map[string]interface{}
	json.Unmarshal(body, &payload)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"received": true})
}

func main() {
	http.HandleFunc("/webhook", webhookHandler)
	http.ListenAndServe(":8080", nil)
}
```

### Ruby

```ruby
require 'openssl'
require 'sinatra'
require 'json'

WEBHOOK_SECRET = ENV['WEBHOOK_SECRET']

def verify_signature(payload, signature, secret)
  return false unless signature&.start_with?('sha256=')

  expected = signature.sub('sha256=', '')
  computed = OpenSSL::HMAC.hexdigest('sha256', secret, payload)

  Rack::Utils.secure_compare(expected, computed)
end

post '/webhook' do
  payload = request.body.read
  signature = request.env['HTTP_X_WEBHOOK_SIGNATURE']

  unless verify_signature(payload, signature, WEBHOOK_SECRET)
    halt 401, { error: 'Invalid signature' }.to_json
  end

  data = JSON.parse(payload)
  puts "Verified event: #{data['event']}"

  content_type :json
  { received: true }.to_json
end
```

---

## Delivery Management

### Delivery States

| Status | Description |
|---|---|
| `pending` | Queued for delivery |
| `delivered` | Endpoint returned 2xx response |
| `failed` | Endpoint returned non-2xx or network error after all retries |

### Delivery Record Schema

```sql
CREATE TABLE webhook_deliveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id     UUID REFERENCES webhooks(id),
  event_type     TEXT NOT NULL,
  payload        JSONB NOT NULL,
  status         TEXT DEFAULT 'pending',
  response_code  INTEGER,
  response_body  TEXT,
  attempts       INTEGER DEFAULT 0,
  delivered_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

### Viewing Delivery History

The `/webhooks` page shows:
- **Delivery stats chart**: 7-day rolling view of success/failure rates
- **Delivery history table**: Filterable by event type and delivery status
- **Response details**: Click a delivery row to see the full response code and body

---

## Retry Behavior

### Automatic Retries

The `send-webhook` Edge Function retries failed deliveries with exponential backoff:

| Attempt | Delay | Total Elapsed |
|---|---|---|
| 1st (initial) | 0s | 0s |
| 2nd (1st retry) | 1s | 1s |
| 3rd (2nd retry) | 2s | 3s |
| 4th (3rd retry) | 4s | 7s |

After 4 attempts (1 initial + 3 retries), the delivery is marked `failed`.

### Manual Retries

- **Individual retry**: Click the retry button on any failed delivery row
- **Bulk retry**: Click "Retry All Failed" to re-attempt all failed deliveries for a webhook

Both use the `retry-webhook` Edge Function, which resets the attempt counter and redelivers.

### What Counts as Failure

| Scenario | Result |
|---|---|
| HTTP 2xx response | ✅ Success |
| HTTP 4xx response | ❌ Failure (no retry — client error) |
| HTTP 5xx response | ❌ Failure (retries) |
| Network timeout | ❌ Failure (retries) |
| DNS resolution failure | ❌ Failure (retries) |
| Connection refused | ❌ Failure (retries) |

---

## Testing Webhooks

### Test Endpoint Button

The `/webhooks` page includes a **Test** button per webhook that sends a synthetic payload:

```json
{
  "event": "test",
  "timestamp": "2026-02-16T14:30:00.000Z",
  "data": {
    "message": "This is a test webhook delivery",
    "webhookId": "your-webhook-id"
  }
}
```

This invokes the `test-webhook` Edge Function. Test deliveries are logged in `webhook_deliveries` like real ones.

### Testing with curl

```bash
# Test the test-webhook function directly
curl -X POST \
  "https://jlnrqriebkfuglwmbniw.supabase.co/functions/v1/test-webhook" \
  -H "Content-Type: application/json" \
  -d '{"webhookId": "YOUR_WEBHOOK_ID"}'
```

### Local Testing Tools

Use these services to inspect webhook payloads during development:

| Service | URL | Notes |
|---|---|---|
| [webhook.site](https://webhook.site) | Free, temporary endpoint | Shows headers + body in real time |
| [RequestBin](https://requestbin.com) | Free tier available | Inspect and replay requests |
| [ngrok](https://ngrok.com) | Tunnel to localhost | Test against your local server |
| [smee.io](https://smee.io) | GitHub-maintained | Event proxy for development |

---

## Monitoring & Analytics

### Dashboard Metrics

The `/webhooks` page displays:

- **7-day delivery chart** (`DeliveryStatsChart` component): Success vs failure rates over time using Recharts
- **Total deliveries**: Count of all delivery attempts
- **Success rate**: Percentage of 2xx responses
- **Active webhooks**: Number of enabled webhook endpoints

### Querying Delivery Data

```sql
-- Delivery success rate (last 7 days)
SELECT
  COUNT(*) FILTER (WHERE status = 'delivered') AS succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'delivered')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS success_rate
FROM webhook_deliveries
WHERE created_at > now() - interval '7 days';

-- Failed deliveries with response details
SELECT
  wd.event_type,
  wd.response_code,
  wd.response_body,
  wd.attempts,
  w.url,
  wd.created_at
FROM webhook_deliveries wd
JOIN webhooks w ON w.id = wd.webhook_id
WHERE wd.status = 'failed'
ORDER BY wd.created_at DESC
LIMIT 20;
```

---

## Debugging

### Common Issues

#### Webhook not firing

1. **Check `is_active`** — Ensure the webhook is enabled
2. **Check `events` array** — Verify the event type is subscribed
3. **Check Edge Function logs** — Look for errors in `send-webhook` function logs
4. **Check delivery records** — Query `webhook_deliveries` for the webhook ID

#### Signature verification fails

1. **Check secret match** — The secret in your webhook config must exactly match the one in your verification code
2. **Check body parsing** — Verify you're computing the HMAC over the raw request body, not a re-serialized version
3. **Check encoding** — Signature is hex-encoded, not Base64
4. **JSON serialization** — `JSON.stringify()` output must match. Key ordering and whitespace matter.

```bash
# Debug: compute expected signature manually
echo -n '{"event":"test","timestamp":"2026-02-16T14:30:00.000Z"}' | \
  openssl dgst -sha256 -hmac "your-secret" | \
  awk '{print "sha256=" $2}'
```

#### Endpoint returns 4xx/5xx

1. **Check URL** — Verify the endpoint is correct and publicly reachable
2. **Check authentication** — If your endpoint requires auth, ensure it accepts the webhook's headers
3. **Check payload** — Use webhook.site to inspect the exact payload being sent
4. **Check CORS** — Webhooks are server-to-server; CORS should not apply, but misconfigured proxies can interfere

#### Deliveries stuck in pending

1. **Check function deployment** — Verify `send-webhook` is deployed and healthy
2. **Check secrets** — Ensure `SUPABASE_SERVICE_ROLE_KEY` is available to the function
3. **Cold start delays** — First invocation after idle may take 1-2 seconds

### Debug Checklist

```
□ Webhook is_active = true
□ Event type is in the webhook's events array
□ Endpoint URL returns 2xx for POST requests
□ Secret matches between config and consumer
□ HMAC computed over raw body (not re-serialized)
□ Edge Function logs show no errors
□ webhook_deliveries table has records for the webhook
□ Response code and body in delivery record match expectations
```

---

## Security Best Practices

1. **Always set a webhook secret** — Without it, anyone can forge requests to your endpoint
2. **Always verify signatures** — Use timing-safe comparison (`crypto.timingSafeEqual`, `hmac.compare_digest`)
3. **Use HTTPS endpoints** — Never send webhooks to HTTP URLs in production
4. **Respond quickly** — Return 200 within 5 seconds; process asynchronously if needed
5. **Idempotency** — Design your handler to safely process the same delivery twice (retries can cause duplicates)
6. **IP allowlisting** — If your firewall supports it, restrict to Supabase Edge Function IPs
7. **Rotate secrets periodically** — Update the secret in both the webhook config and your consumer
8. **Log and monitor** — Track delivery success rates; alert on sustained failures

---

## Related Documentation

- [Edge Functions Reference](./EDGE_FUNCTIONS.md) — Detailed specs for `send-webhook`, `test-webhook`, `retry-webhook`
- [API Reference](./API.md) — Database schema and function signatures
- [Security Policy](./SECURITY.md) — HMAC signing implementation details
- [Architecture](./ARCHITECTURE.md) — System design and data flow
