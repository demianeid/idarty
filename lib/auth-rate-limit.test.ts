import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Tests for authentication rate limiting.
 * Verifies that the auth hook enforces rate limits on login/signup.
 */

const mockCheckRateLimit = vi.fn()

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => {}),
}))

vi.mock('@/lib/db', () => ({
  db: {},
}))

vi.mock('@/lib/email/send', () => ({
  sendTransactionalEmail: vi.fn(),
}))

vi.mock('better-auth', () => ({
  betterAuth: (config: any) => ({
    api: { getSession: vi.fn() },
    $Infer: { Session: {} },
    hooks: config.hooks,
  }),
}))

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: () => ({}),
}))

describe('auth rate limiting', () => {
  beforeEach(() => {
    mockCheckRateLimit.mockReset()
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: new Date(Date.now() + 15 * 60_000),
    })
  })

  it('applies rate limiting to login endpoint', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/sign-in/email',
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    })

    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1)
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth:192.168.1.1', 10, 15 * 60_000)
  })

  it('applies rate limiting to signup endpoint', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/sign-up/email',
      headers: new Headers({ 'x-forwarded-for': '10.0.0.1' }),
    })

    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1)
    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth:10.0.0.1', 5, 15 * 60_000)
  })

  it('does not apply rate limiting to non-auth endpoints', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/some-other-endpoint',
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    })

    expect(mockCheckRateLimit).not.toHaveBeenCalled()
  })

  it('does not apply rate limiting to other auth paths like verify-email', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/verify-email',
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    })

    expect(mockCheckRateLimit).not.toHaveBeenCalled()
  })

  it('does not apply rate limiting to change-password', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/change-password',
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    })

    expect(mockCheckRateLimit).not.toHaveBeenCalled()
  })

  it('throws RATE_LIMITED error with retryAfterSec when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 120_000),
    })

    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    const error = await beforeHook({
      path: '/sign-in/email',
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('Too many attempts. Please try again later.')
    expect((error as any).code).toBe('RATE_LIMITED')
    expect((error as any).retryAfterSec).toBeGreaterThan(0)
    expect((error as any).retryAfterSec).toBeLessThanOrEqual(120)
  })

  it('throws RATE_LIMITED error for signup when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000),
    })

    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    const error = await beforeHook({
      path: '/sign-up/email',
      headers: new Headers({ 'x-forwarded-for': '10.0.0.1' }),
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as any).code).toBe('RATE_LIMITED')
    expect((error as any).retryAfterSec).toBeGreaterThan(0)
  })

  it('uses unknown IP when x-forwarded-for header is missing', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/sign-in/email',
      headers: new Headers(),
    })

    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth:unknown', 10, 15 * 60_000)
  })

  it('uses first IP from x-forwarded-for when multiple IPs are present', async () => {
    const { auth } = await import('./auth')
    const beforeHook = (auth as any).hooks.before

    await beforeHook({
      path: '/sign-in/email',
      headers: new Headers({ 'x-forwarded-for': '203.0.113.1, 192.168.1.1' }),
    })

    expect(mockCheckRateLimit).toHaveBeenCalledWith('auth:203.0.113.1', 10, 15 * 60_000)
  })
})
