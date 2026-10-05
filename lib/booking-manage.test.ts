import { beforeEach, describe, expect, it } from 'vitest'

process.env.BETTER_AUTH_SECRET = 'test-secret-with-at-least-32-characters-long'

import { createBookingManageToken, verifyBookingManageToken } from './booking-manage'

const bookingId = '123e4567-e89b-12d3-a456-426614174000'

describe('booking management tokens', () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-with-at-least-32-characters-long'
  })

  it('creates a token that verifies for the same booking', () => {
    const token = createBookingManageToken(bookingId)
    expect(verifyBookingManageToken(token)).toBe(bookingId)
  })

  it('rejects tampered tokens and tokens for another booking', () => {
    const token = createBookingManageToken(bookingId)
    const [id, signature] = token.split('.')
    expect(verifyBookingManageToken(`${id}.${signature}x`)).toBeNull()
    expect(verifyBookingManageToken(`${'223e4567-e89b-12d3-a456-426614174000'}.${signature}`)).toBeNull()
  })
})
