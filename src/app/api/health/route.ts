import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Health check endpoint for GitHub Actions keepalive workflow
 *
 * Returns { status: "healthy" } if database is responsive
 * Returns { status: "unhealthy" } if database is down or times out
 *
 * @see .github/workflows/keepalive.yml
 */
export async function GET() {
  try {
    // Simple database connectivity check with 5s timeout
    await Promise.race([
      db.execute('SELECT 1'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      ),
    ])

    // If we get here, database is responsive
    return NextResponse.json({ status: 'healthy' }, { status: 200 })
  } catch {
    // Any error = unhealthy (never crash)
    return NextResponse.json({ status: 'unhealthy' }, { status: 200 })
  }
}
