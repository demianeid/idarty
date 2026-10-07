import { createHmac, timingSafeEqual } from 'node:crypto'

const secret = () => {
  const s = process.env.BETTER_AUTH_SECRET
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in production')
  }
  return s ?? 'development-only-secret'
}

/**
 * Configurable token lifetime in hours (default 72 = 3 days).
 * Set via BOOKING_MANAGE_TOKEN_TTL_HOURS env var.
 */
const tokenTtlHours = () => {
  const raw = process.env.BOOKING_MANAGE_TOKEN_TTL_HOURS
  if (!raw) return 72
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 72
}

/**
 * Token format: `{bookingId}.{expiresAt}.{signature}`
 * - bookingId: UUID v4
 * - expiresAt: Unix timestamp (seconds)
 * - signature: HMAC-SHA256 of "{bookingId}.{expiresAt}" using BETTER_AUTH_SECRET
 */
export function createBookingManageToken(bookingId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + tokenTtlHours() * 3600
  const payload = `${bookingId}.${expiresAt}`
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyBookingManageToken(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [bookingId, expiresAtStr, signature] = parts
  if (!bookingId || !expiresAtStr || !signature) return null
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return null

  const expiresAt = parseInt(expiresAtStr, 10)
  // 60-second clock-skew tolerance: expired tokens are still rejected,
  // but valid tokens aren't rejected prematurely due to minor clock differences
  const skewToleranceMs = 60_000
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= Date.now() - skewToleranceMs) return null

  const payload = `${bookingId}.${expiresAtStr}`
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  const provided = Buffer.from(signature)
  const target = Buffer.from(expected)
  const valid = provided.length === target.length && timingSafeEqual(provided, target)
  return valid ? bookingId : null
}
