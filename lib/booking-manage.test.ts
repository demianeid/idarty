import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.BETTER_AUTH_SECRET = 'test-secret-with-at-least-32-characters-long'

import { createBookingManageToken, verifyBookingManageToken } from './booking-manage'

const bookingId = '123e4567-e89b-12d3-a456-426614174000'

describe('booking management tokens', () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-with-at-least-32-characters-long'
    delete process.env.BOOKING_MANAGE_TOKEN_TTL_HOURS
    vi.useRealTimers()
  })

  it('creates a token that verifies for the same booking', () => {
    const token = createBookingManageToken(bookingId)
    expect(verifyBookingManageToken(token)).toBe(bookingId)
  })

  it('rejects tampered tokens and tokens for another booking', () => {
    const token = createBookingManageToken(bookingId)
    const [id, expiresAt, signature] = token.split('.')
    expect(verifyBookingManageToken(`${id}.${expiresAt}.${signature}x`)).toBeNull()
    expect(verifyBookingManageToken(`${'223e4567-e89b-12d3-a456-426614174000'}.${expiresAt}.${signature}`)).toBeNull()
  })

  it('rejects tokens with wrong number of segments', () => {
    expect(verifyBookingManageToken('foo.bar')).toBeNull()
    expect(verifyBookingManageToken('a.b.c.d')).toBeNull()
    expect(verifyBookingManageToken('')).toBeNull()
  })

  it('rejects expired tokens', () => {
    // Create a token, then mock Date.now to be 4 days in the future (default TTL is 72h)
    const token = createBookingManageToken(bookingId)
    const realNow = Date.now
    Date.now = vi.fn(() => realNow() + 4 * 24 * 60 * 60 * 1000)
    try {
      expect(verifyBookingManageToken(token)).toBeNull()
    } finally {
      Date.now = realNow
    }
  })

  it('accepts tokens that are still within their validity window', () => {
    const token = createBookingManageToken(bookingId)
    const realNow = Date.now
    Date.now = vi.fn(() => realNow() + 48 * 60 * 60 * 1000) // 2 days later (within 72h)
    try {
      expect(verifyBookingManageToken(token)).toBe(bookingId)
    } finally {
      Date.now = realNow
    }
  })

  it('respects custom TTL via BOOKING_MANAGE_TOKEN_TTL_HOURS', () => {
    process.env.BOOKING_MANAGE_TOKEN_TTL_HOURS = '1' // 1 hour
    const token = createBookingManageToken(bookingId)
    const realNow = Date.now
    // 2 hours later — should be expired
    Date.now = vi.fn(() => realNow() + 2 * 60 * 60 * 1000)
    try {
      expect(verifyBookingManageToken(token)).toBeNull()
    } finally {
      Date.now = realNow
    }
  })

  it('falls back to 72h when BOOKING_MANAGE_TOKEN_TTL_HOURS is invalid', () => {
    process.env.BOOKING_MANAGE_TOKEN_TTL_HOURS = 'not-a-number'
    const token = createBookingManageToken(bookingId)
    const realNow = Date.now
    // 48h later — should still be valid with default 72h TTL
    Date.now = vi.fn(() => realNow() + 48 * 60 * 60 * 1000)
    try {
      expect(verifyBookingManageToken(token)).toBe(bookingId)
    } finally {
      Date.now = realNow
    }
  })

  it('accepts tokens within 60s clock-skew tolerance after expiration', () => {
    const token = createBookingManageToken(bookingId)
    const realNow = Date.now
    // 30 seconds after expiration — within 60s tolerance, should still be valid
    Date.now = vi.fn(() => realNow() + 72 * 60 * 60 * 1000 + 30 * 1000)
    try {
      expect(verifyBookingManageToken(token)).toBe(bookingId)
    } finally {
      Date.now = realNow
    }
  })

  it('rejects tokens beyond 60s clock-skew tolerance after expiration', () => {
    const token = createBookingManageToken(bookingId)
    const realNow = Date.now
    // 120 seconds after expiration — beyond 60s tolerance, should be rejected
    Date.now = vi.fn(() => realNow() + 72 * 60 * 60 * 1000 + 120 * 1000)
    try {
      expect(verifyBookingManageToken(token)).toBeNull()
    } finally {
      Date.now = realNow
    }
  })
})
