```text
cronjob.org  ──GET──▶  /api/cron/supabase-keepalive  (Next.js App Router route)
                              │
                Authorization: Bearer CRON_SECRET
                              │
                    ┌─────────┴───────────────┐
                    │  Supabase REST/Auth/    │
                    │  Storage + DB RPC ping  │
                    └─────────┬───────────────┘
                              │
                    backup manifest from DB
                              │
                         Slack webhook
```

## Env vars

| Variable | Example | Description |
|---|---|---|
| `CRON_SECRET` | `openssl rand -hex 32` | Bearer token required by the cron route |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Slack Incoming Webhook used for success and failure notifications |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase project base URL for REST/Auth/Storage health checks |
| `SUPABASE_ANON_KEY` | `eyJ...` | Anon key used for REST/Auth/Storage requests and RPC ping |
| `SUPABASE_DB_URL` | `postgresql://...` | Direct Postgres connection used to build backup metadata |

## DB setup

Run this once in the Supabase SQL Editor so the route can hit the REST RPC database ping endpoint:

```sql
CREATE OR REPLACE FUNCTION public.ping()
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1; $$;
GRANT EXECUTE ON FUNCTION public.ping() TO anon;
```

The backup portion of the route does not upload files. It only scans `public` tables, counts rows, and returns estimated JSON payload sizes in the response/Slack output.

## Slack webhook

Create an Incoming Webhook in Slack:

1. Open https://api.slack.com/apps
2. Create or pick your app
3. Enable **Incoming Webhooks**
4. Add a webhook for the destination channel
5. Copy the webhook URL into `SLACK_WEBHOOK_URL`

Success messages are simple one-liners. Failures use a richer Block Kit payload with per-service details.

## Deploy

1. Add the env vars in Vercel for this project.
2. Deploy your branch normally.
3. Smoke-test the route after deploy:

```bash
curl -i \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-vercel-domain.vercel.app/api/cron/supabase-keepalive
```

Expected behavior:
- `200` when all pings and backup manifest generation succeed
- `207` when any service check, backup manifest step, or Slack notification fails
- `401` when the bearer token is missing or invalid

## cronjob.org config

| Setting | Value |
|---|---|
| Title | `Supabase Keepalive` |
| URL | `https://your-vercel-domain.vercel.app/api/cron/supabase-keepalive` |
| Schedule | `*/15 * * * *` |
| Method | `GET` |
| Header name | `Authorization` |
| Header value | `Bearer <CRON_SECRET>` |
| Timeout | `30 seconds` |

## Disable old GitHub Actions

After the external cron route is deployed and smoke-tested, remove the old workflow:

```bash
rm .github/workflows/supabase-keepalive.yml
```

Or disable/delete it from the GitHub Actions UI if you want to keep the file around temporarily.
