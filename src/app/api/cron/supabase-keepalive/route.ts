import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type EnvKey =
  | 'CRON_SECRET'
  | 'SLACK_WEBHOOK_URL'
  | 'SUPABASE_URL'
  | 'SUPABASE_ANON_KEY'
  | 'SUPABASE_DB_URL'

interface PingResult {
  label: string
  emoji: string
  ok: boolean
  status?: number | string
  error?: string
  ms: number
}

interface BackupFile {
  name: string
  rows: number
  bytes: number
}

interface BackupResult {
  ok: boolean
  manifest?: {
    timestamp: string
    tableCount: number
    totalRows: number
    files: BackupFile[]
  }
  error?: string
  ms: number
}

interface NotificationResult {
  ok: boolean
  error?: string
}

const REQUEST_TIMEOUT_MS = 20_000

function getEnv(name: EnvKey): string | undefined {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value.trim() : undefined
}

function isAuthorized(req: NextRequest): boolean {
  const secret = getEnv('CRON_SECRET')
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unknown error'
}

function createSupabaseHeaders() {
  const anonKey = getEnv('SUPABASE_ANON_KEY')

  if (!anonKey) {
    return undefined
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }
}

function createConfigErrorResult(error: string): PingResult {
  return {
    label: 'Configuration',
    emoji: '⚙️',
    ok: false,
    error,
    ms: 0,
  }
}

async function pingUrl(
  label: string,
  emoji: string,
  url: string,
  headers?: HeadersInit,
  acceptedStatuses?: number[]
): Promise<PingResult> {
  const startedAt = Date.now()

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })

    const ok = acceptedStatuses
      ? acceptedStatuses.includes(response.status)
      : response.ok

    return {
      label,
      emoji,
      ok,
      status: response.status,
      ms: Date.now() - startedAt,
      error: ok ? undefined : `Unexpected status ${response.status}`,
    }
  } catch (error) {
    return {
      label,
      emoji,
      ok: false,
      error: sanitizeError(error),
      ms: Date.now() - startedAt,
    }
  }
}

async function pingDatabaseRpc(
  supabaseUrl: string,
  headers?: HeadersInit
): Promise<PingResult> {
  const startedAt = Date.now()

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: '{}',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })

    const ok = response.status === 200 || response.status === 404

    return {
      label: 'Database',
      emoji: '🗃️',
      ok,
      status: response.status,
      error: ok ? undefined : `Unexpected status ${response.status}`,
      ms: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      label: 'Database',
      emoji: '🗃️',
      ok: false,
      error: sanitizeError(error),
      ms: Date.now() - startedAt,
    }
  }
}

async function buildBackupManifest(connectionString: string): Promise<BackupResult> {
  const startedAt = Date.now()
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 20,
    prepare: false,
  })

  try {
    const tables = await sql<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    const files = await Promise.all(
      tables.map(async ({ tablename }) => {
        const [{ row_count: rowCountValue, payload_bytes: payloadBytesValue }] = await sql<{
          row_count: number | string
          payload_bytes: number | string
        }[]>`
          SELECT
            COUNT(*)::int AS row_count,
            COALESCE(SUM(pg_column_size(to_jsonb(t))), 0)::bigint AS payload_bytes
          FROM public.${sql(tablename)} AS t
        `

        const rowCount = Number(rowCountValue ?? 0)
        const payloadBytes = Number(payloadBytesValue ?? 2)

        return {
          name: `${tablename}.json`,
          rows: Number.isFinite(rowCount) ? rowCount : 0,
          bytes: Number.isFinite(payloadBytes) ? payloadBytes : 2,
        }
      })
    )

    const totalRows = files.reduce((sum, file) => sum + file.rows, 0)

    return {
      ok: true,
      manifest: {
        timestamp: new Date().toISOString(),
        tableCount: files.length,
        totalRows,
        files,
      },
      ms: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeError(error),
      ms: Date.now() - startedAt,
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function sendSlackNotification(params: {
  allOk: boolean
  totalMs: number
  results: PingResult[]
  backup: BackupResult
}): Promise<NotificationResult> {
  const webhookUrl = getEnv('SLACK_WEBHOOK_URL')

  if (!webhookUrl) {
    return { ok: true }
  }

  const { allOk, totalMs, results, backup } = params
  const failed = results.filter((result) => !result.ok)
  const passed = results.filter((result) => result.ok)
  const backupLine = backup?.ok
    ? `📦 Backup manifest: ${backup.manifest?.tableCount ?? 0} tables · ${backup.manifest?.totalRows ?? 0} rows`
    : backup
      ? `📦 Backup manifest failed: ${backup.error ?? 'Unknown error'}`
      : '📦 Backup manifest skipped'

  const body = allOk
    ? {
        text:
          `✅ Supabase keep-alive OK (${totalMs}ms)\n` +
          results
            .map((result) => {
              return `${result.emoji} *${result.label}*: ✅ ${result.ms}ms`
            })
            .concat(backupLine)
            .join('\n'),
      }
    : {
        text: '🚨 Supabase keep-alive failed',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Supabase Keep-Alive FAILED',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${failed.length} service(s) failed* out of ${results.length} — ${totalMs}ms`,
            },
          },
          { type: 'divider' },
          ...failed.map((result) => ({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `${result.emoji} *${result.label}* ❌`,
                result.status !== undefined ? `  • Status: \`${result.status}\`` : '',
                result.error ? `  • Error: \`${result.error}\`` : '',
                `  • Latency: ${result.ms}ms`,
              ]
                .filter(Boolean)
                .join('\n'),
            },
          })),
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: backupLine,
            },
          },
          ...(passed.length > 0
            ? [
                { type: 'divider' as const },
                {
                  type: 'section' as const,
                  text: {
                    type: 'mrkdwn' as const,
                    text:
                      '*Still healthy:* ' +
                      passed
                        .map((result) => {
                          return `${result.emoji} ${result.label} (${result.ms}ms)`
                        })
                        .join(' · '),
                  },
                },
              ]
            : []),
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `At ${new Date().toUTCString()}`,
              },
            ],
          },
        ],
      }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        ok: false,
        error: `Slack webhook returned ${response.status}`,
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeError(error),
    }
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = getEnv('SUPABASE_URL')
  const supabaseDbUrl = getEnv('SUPABASE_DB_URL')
  const headers = createSupabaseHeaders()
  const results: PingResult[] = []
  const pingTasks: Promise<PingResult>[] = []

  if (!supabaseUrl) {
    results.push(createConfigErrorResult('SUPABASE_URL is required'))
  } else {
    pingTasks.push(pingDatabaseRpc(supabaseUrl, headers))
    pingTasks.push(
      pingUrl('REST', '📡', `${supabaseUrl}/rest/v1/`, headers, [200, 401]),
      pingUrl('Auth', '🔐', `${supabaseUrl}/auth/v1/health`, headers, [200]),
      pingUrl('Storage', '🗄️', `${supabaseUrl}/storage/v1/status`, headers, [200])
    )
  }

  const startedAt = Date.now()
  const pingResults = await Promise.all(pingTasks)
  results.push(...pingResults)

  const backup: BackupResult = supabaseDbUrl
    ? await buildBackupManifest(supabaseDbUrl)
    : {
        ok: false,
        error: 'SUPABASE_DB_URL is required for backup manifest generation',
        ms: 0,
      }

  const notification = await sendSlackNotification({
    allOk: results.every((result) => result.ok) && backup.ok,
    totalMs: Date.now() - startedAt,
    results,
    backup,
  })

  if (!notification.ok) {
    results.push({
      label: 'Slack',
      emoji: '💬',
      ok: false,
      error: notification.error,
      ms: 0,
    })
  }

  const allOk = results.every((result) => result.ok) && backup.ok
  const totalMs = Date.now() - startedAt

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),
      totalMs,
      results,
      backup,
    },
    { status: allOk ? 200 : 207 }
  )
}
