import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for uptime monitoring.
 * Returns only non-sensitive status information.
 * Does NOT expose: database credentials, internal errors, environment details.
 */
export async function GET() {
  try {
    // Verify database connectivity with a lightweight query
    await db.execute(sql`SELECT 1`)
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 },
    )
  } catch {
    // Do not expose internal error details
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 503 },
    )
  }
}
