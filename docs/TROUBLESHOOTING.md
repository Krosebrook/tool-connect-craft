# Troubleshooting Guide

Comprehensive FAQ covering common errors, debugging steps, and solutions for every component in Tool Connect Craft.

---

## Table of Contents

1. [OAuth & Connections](#oauth--connections)
2. [Webhook Delivery](#webhook-delivery)
3. [Tool Execution & Pipeline Jobs](#tool-execution--pipeline-jobs)
4. [Edge Functions](#edge-functions)
5. [Database & RLS](#database--rls)
6. [Token Management](#token-management)
7. [Scheduler](#scheduler)
8. [UI & Frontend](#ui--frontend)
9. [Environment & Configuration](#environment--configuration)

---

## OAuth & Connections

### "OAuth session expired. Please try again."

**Cause:** The PKCE `code_verifier` was cleared from `sessionStorage` before the callback completed.

**Fix:**
- Ensure the OAuth redirect URI matches exactly: `${window.location.origin}/connectors`
- Don't open the OAuth flow in a new tab — `sessionStorage` is per-tab
- Check that no browser extensions are clearing session storage

### "Failed to start OAuth flow"

**Cause:** The `oauth-start` Edge Function returned an error.

**Debug:**
1. Check Edge Function logs for `oauth-start`
2. Verify the connector's `oauth_config` JSON contains valid `authorization_url`, `token_url`, `client_id`
3. Ensure the `TOKEN_ENCRYPTION_KEY` secret is set (required for PKCE state hashing)

### Connection stuck in "pending" status

**Cause:** The OAuth callback never completed.

**Fix:**
```sql
-- Check for stale OAuth transactions
SELECT * FROM oauth_transactions
WHERE status = 'started'
  AND created_at < now() - interval '15 minutes';

-- Clean up stale transactions
UPDATE oauth_transactions
SET status = 'failed', completed_at = now()
WHERE status = 'started'
  AND created_at < now() - interval '15 minutes';
```

### "Connection Failed" after successful OAuth consent screen

**Cause:** Token exchange failed in `oauth-callback`.

**Debug:**
1. Check `oauth-callback` Edge Function logs for the specific error
2. Common causes:
   - Incorrect `client_secret` in the connector's `oauth_config`
   - Mismatched `redirect_uri` between start and callback
   - Expired authorization code (codes are single-use and short-lived)

---

## Webhook Delivery

### Webhooks not firing

**Checklist:**
1. Is the webhook `is_active = true`?
2. Does the webhook's `events` array include the event being triggered?
3. Is the `user_id` on the webhook correct?

```sql
-- Check webhook configuration
SELECT id, name, url, events, is_active, user_id
FROM webhooks
WHERE is_active = true;
```

### Signature verification failing on the receiving end

**Cause:** Payload mismatch between what was signed and what was received.

**Fix:**
- The signature is computed over `JSON.stringify(payload)` — verify you're comparing against the raw request body, not a re-serialized version
- Use the exact header name: `X-Webhook-Signature` (format: `sha256=<hex>`)
- See [WEBHOOKS.md](./WEBHOOKS.md) for verification examples in Node/Python/Go/Ruby

### Delivery stuck in "pending"

**Cause:** The `send-webhook` function crashed before updating the delivery record.

**Fix:**
```sql
-- Find orphaned pending deliveries older than 5 minutes
SELECT id, webhook_id, event_type, created_at
FROM webhook_deliveries
WHERE status = 'pending'
  AND created_at < now() - interval '5 minutes';

-- Mark them as failed
UPDATE webhook_deliveries
SET status = 'failed', response_body = 'Delivery timed out'
WHERE status = 'pending'
  AND created_at < now() - interval '5 minutes';
```

### "Request timed out after 10 seconds" on test webhook

**Cause:** The target URL took too long to respond.

**Fix:**
- Test your endpoint independently with `curl`
- Ensure the endpoint returns a response within 10 seconds
- For slow endpoints, have them accept the payload and process asynchronously (return 200 immediately)

---

## Tool Execution & Pipeline Jobs

### Job stuck in "running" state

**Cause:** The `execute-tool` function crashed or timed out mid-execution.

**Debug:**
```sql
-- Find stuck jobs (running for more than 5 minutes)
SELECT id, connector_id, type, started_at
FROM pipeline_jobs
WHERE status = 'running'
  AND started_at < now() - interval '5 minutes';
```

**Fix:**
```sql
UPDATE pipeline_jobs
SET status = 'failed',
    error = 'Job timed out',
    finished_at = now()
WHERE status = 'running'
  AND started_at < now() - interval '5 minutes';
```

### "Rate limit exceeded"

**Cause:** More than 30 requests/minute per user or 100 requests/minute per connector.

**Fix:**
- Space out requests or implement client-side queuing
- Check `action_logs` for request frequency:

```sql
SELECT user_id, count(*), min(created_at), max(created_at)
FROM action_logs
WHERE created_at > now() - interval '1 minute'
GROUP BY user_id
ORDER BY count DESC;
```

### "Invalid arguments" error on tool execution

**Cause:** The request body doesn't match the tool's JSON Schema.

**Debug:**
1. Fetch the tool's schema:
```sql
SELECT name, schema FROM connector_tools WHERE id = '<tool_id>';
```
2. Validate your input against the schema
3. Check for required fields, type mismatches, and enum constraints

---

## Edge Functions

### CORS errors in browser console

**Symptoms:** `Access to fetch has been blocked by CORS policy`

**Fix:** Ensure every Edge Function includes:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

**Critical:** Include `corsHeaders` in ALL responses, including error responses.

### Edge Function returns 500

**Debug:**
1. Check Edge Function logs in the backend dashboard
2. Common causes:
   - Missing environment variable / secret
   - Uncaught exception in async code
   - Invalid JSON in request body
3. Add `try/catch` around the entire handler and log the error

### "Function not found" (404)

**Cause:** The function name in the client doesn't match the folder name.

**Fix:**
- Function folder: `supabase/functions/my-function/index.ts`
- Client call: `supabase.functions.invoke('my-function', ...)`
- Ensure the function is listed in `supabase/config.toml`

### Edge Function deploy failures

**Cause:** Incompatible `deno.lock` or invalid imports.

**Fix:**
1. Remove or rename `deno.lock` and retry
2. Prefer `npm:` specifiers over `esm.sh` for stability
3. Keep all code in `index.ts` — no subfolder imports

---

## Database & RLS

### "new row violates row-level security policy"

**Cause:** The insert/update doesn't satisfy the table's RLS policy.

**Checklist:**
1. Is the user authenticated? RLS policies using `auth.uid()` require a valid session
2. Does the `user_id` column match `auth.uid()`?
3. Is `user_id` set in the insert statement?

```sql
-- Check RLS policies on a table
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table';
```

### "infinite recursion detected in policy"

**Cause:** An RLS policy on a table queries the same table.

**Fix:** Use a `SECURITY DEFINER` function instead:
```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;
```

### Missing data — only seeing partial results

**Cause:** Supabase has a default limit of 1000 rows per query.

**Fix:** Add explicit pagination:
```typescript
const { data } = await supabase
  .from('table')
  .select('*')
  .range(0, 999); // Explicit range
```

---

## Token Management

### "Token refresh failed"

**Debug:**
1. Check `token-refresh` Edge Function logs
2. Verify the connector has a valid `refresh_token` stored
3. Ensure the provider's token endpoint is reachable

```sql
-- Check connection token state
SELECT id, connector_id, status, expires_at,
       secret_ref_access IS NOT NULL as has_access_token,
       secret_ref_refresh IS NOT NULL as has_refresh_token
FROM user_connections
WHERE status = 'active';
```

### Tokens expiring despite auto-refresh

**Cause:** The scheduled refresh job isn't running or is failing silently.

**Debug:**
```sql
-- Check scheduler job status
SELECT name, is_active, last_run_at, last_status, last_error, next_run_at
FROM scheduler_jobs
WHERE function_name = 'token-refresh';
```

### "Connection expired" banner keeps appearing

**Cause:** `expires_at` is in the past and the refresh failed.

**Fix:**
1. Try a manual token refresh from the UI
2. If that fails, disconnect and reconnect the integration
3. Check if the OAuth provider revoked the refresh token (common after password changes)

---

## Scheduler

### Scheduled job not executing

**Checklist:**
1. Is the job `is_active = true`?
2. Is `next_run_at` in the past (meaning it should have run)?
3. Check `last_error` for failure details

```sql
SELECT name, schedule, is_active, next_run_at, last_run_at, last_status, last_error
FROM scheduler_jobs
ORDER BY next_run_at;
```

### Invalid cron expression

**Cause:** The `schedule` field contains an unsupported cron format.

**Valid formats:**
- `*/5 * * * *` — every 5 minutes
- `0 */6 * * *` — every 6 hours
- `0 9 * * 1-5` — weekdays at 9 AM

---

## UI & Frontend

### Blank page / white screen

**Debug:**
1. Open browser DevTools → Console for errors
2. Common causes:
   - Missing environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
   - Import errors from missing dependencies
   - React rendering errors in the component tree

### Toast notifications not appearing

**Cause:** The `<Toaster />` component may be missing from the app root.

**Fix:** Ensure `App.tsx` includes:
```tsx
<Toaster />
```

### Charts not rendering (Recharts)

**Cause:** Empty data array or incorrect data shape.

**Debug:**
- Check that the data prop is an array of objects with the expected keys
- Verify the `dataKey` props on `<Bar>`, `<Line>`, etc. match your data keys
- Ensure the container has explicit width/height

### Realtime updates not appearing

**Checklist:**
1. Is the table added to the realtime publication?
```sql
-- Check which tables have realtime enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```
2. Is the Supabase channel subscribed correctly?
3. Are RLS policies allowing the user to `SELECT` the updated rows?

---

## Environment & Configuration

### "Missing required environment variable" error on startup

**Cause:** `src/lib/config.ts` validates required env vars at import time.

**Fix:**
- Ensure `.env` contains all three required variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- Never commit `.env` — use `.env.example` as a template

### Edge Function can't access secrets

**Cause:** Secrets are set in the Lovable Cloud dashboard, not in `.env`.

**Fix:**
- Edge Functions use `Deno.env.get('SECRET_NAME')`, not `import.meta.env`
- Verify the secret exists in the backend secrets configuration
- Secret names are case-sensitive

### Build succeeds but app crashes in production

**Debug:**
1. Check for `import.meta.env.DEV`-only code paths
2. Verify all API URLs use environment variables, not hardcoded values
3. Test with `vite preview` locally to simulate production

---

## General Debugging Workflow

When encountering any issue, follow this sequence:

1. **Check browser console** — look for JavaScript errors and failed network requests
2. **Check Edge Function logs** — available in the backend dashboard
3. **Query the database** — use the SQL queries above to inspect state
4. **Review recent changes** — check `action_logs` and `webhook_deliveries` for patterns
5. **Isolate the component** — determine if the issue is frontend, Edge Function, or database

```sql
-- Quick health check: recent errors across all components
SELECT 'action_logs' as source, count(*) as errors
FROM action_logs WHERE status = 'error' AND created_at > now() - interval '1 hour'
UNION ALL
SELECT 'webhook_deliveries', count(*)
FROM webhook_deliveries WHERE status = 'failed' AND created_at > now() - interval '1 hour'
UNION ALL
SELECT 'pipeline_jobs', count(*)
FROM pipeline_jobs WHERE status = 'failed' AND created_at > now() - interval '1 hour';
```

---

*For additional help, see [DEPLOYMENT.md](./DEPLOYMENT.md) for production configuration and [SECURITY.md](./SECURITY.md) for access control details.*
