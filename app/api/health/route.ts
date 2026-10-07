import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cronRuns } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for uptime monitoring.
 * Returns only non-sensitive status information.
 * Does NOT expose: database credentials, internal errors, environment details.
 */
export async function GET() {
  const components: Record<string, string> = {}
  let overallStatus = 'ok'

  // Database check
  try {
    await db.execute(sql`SELECT 1`)
    components.database = 'healthy'
  } catch {
    components.database = 'unhealthy'
    overallStatus = 'error'
  }

  // Email configuration check
  try {
    const emailConfigured = Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_APP_PASSWORD)
    components.email = emailConfigured ? 'configured' : 'not_configured'
  } catch {
    components.email = 'error'
  }

  // Cron status check
  try {
    const lastCron = await db
      .select({ status: cronRuns.status, startedAt: cronRuns.startedAt })
      .from(cronRuns)
      .where(sql`${cronRuns.job} = 'reminders'`)
      .orderBy(sql`${cronRuns.startedAt} DESC`)
      .limit(1)

    if (lastCron.length > 0) {
      const lastRun = lastCron[0]
      const hoursSinceLastRun = (Date.now() - lastRun.startedAt.getTime()) / (1000 * 60 * 60)
      if (lastRun.status === 'failed') {
        components.cron = 'last_run_failed'
      } else if (hoursSinceLastRun > 25) {
        components.cron = 'stale'
      } else {
        components.cron = 'healthy'
      }
    } else {
      components.cron = 'no_runs_yet'
    }
  } catch {
    components.cron = 'error'
  }

  return NextResponse.json(
    { status: overallStatus, components, timestamp: new Date().toISOString() },
    { status: overallStatus === 'ok' ? 200 : 503 },
  )
}
