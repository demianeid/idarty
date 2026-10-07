import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rateLimits } from '@/lib/db/schema'

/**
 * Fixed-window rate limiter backed by Postgres.
 *
 * Uses an UPSERT so there is no need for a separate read-before-write.
 * Old windows are automatically reset instead of accumulating rows.
 *
 * @param key       Unique identifier (e.g. `"book:{ip}"`, `"auth:{email}"`)
 * @param limit     Maximum allowed requests in the window
 * @param windowMs  Window duration in milliseconds
 * @returns `{ allowed: boolean, remaining: number, resetAt: Date }`
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const resetAt = new Date(windowStart.getTime() + windowMs)

  // UPSERT: if the key is new or belongs to an old window → reset count to 1.
  // If the key is in the current window → increment.
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStartedAt: windowStart })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`
          CASE
            WHEN rate_limits.window_started_at = ${windowStart}
            THEN rate_limits.count + 1
            ELSE 1
          END
        `,
        windowStartedAt: sql`
          CASE
            WHEN rate_limits.window_started_at = ${windowStart}
            THEN rate_limits.window_started_at
            ELSE ${windowStart}
          END
        `,
      },
    })
    .returning({ count: rateLimits.count })

  const count = rows[0]?.count ?? 1
  const allowed = count <= limit
  const remaining = Math.max(0, limit - count)

  return { allowed, remaining, resetAt }
}

/**
 * Convenience helper that throws a structured error when rate-limited.
 * Returns void when the request is allowed.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message?: { ar: string; en: string },
) {
  const { allowed, resetAt } = await checkRateLimit(key, limit, windowMs)
  if (!allowed) {
    const retryAfterSec = Math.ceil((resetAt.getTime() - Date.now()) / 1000)
    throw Object.assign(
      new Error(message?.ar ?? 'Too many requests. Please try again later.'),
      { code: 'RATE_LIMITED', retryAfterSec, message },
    )
  }
}
