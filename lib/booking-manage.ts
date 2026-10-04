import { createHmac, timingSafeEqual } from 'node:crypto'

const secret = () => process.env.BETTER_AUTH_SECRET ?? 'development-only-secret'

export function createBookingManageToken(bookingId: string) {
  const signature = createHmac('sha256', secret()).update(bookingId).digest('base64url')
  return `${bookingId}.${signature}`
}

export function verifyBookingManageToken(token: string) {
  const [bookingId, signature] = token.split('.')
  if (!bookingId || !signature || !/^[0-9a-f-]{36}$/i.test(bookingId)) return null
  const expected = createHmac('sha256', secret()).update(bookingId).digest('base64url')
  const provided = Buffer.from(signature)
  const target = Buffer.from(expected)
  const valid = provided.length === target.length && timingSafeEqual(provided, target)
  return valid ? bookingId : null
}
