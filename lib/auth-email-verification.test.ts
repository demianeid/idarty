import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Tests for email verification explicit opt-in behavior (HIGH-3).
 * Verifies that email verification is required by default and only
 * skipped when SKIP_EMAIL_VERIFICATION=true is explicitly set.
 */

vi.mock('better-auth', () => ({
  betterAuth: (config: any) => ({
    api: { getSession: vi.fn() },
    $Infer: { Session: {} },
    hooks: config.hooks,
    _config: config,
  }),
}))

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: () => ({}),
}))

vi.mock('@/lib/db', () => ({
  db: {},
}))

vi.mock('@/lib/email/send', () => ({
  sendTransactionalEmail: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => {}),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 9, resetAt: new Date() })),
}))

describe('email verification explicit opt-in', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('requires email verification by default (no SKIP_EMAIL_VERIFICATION)', async () => {
    delete process.env.SKIP_EMAIL_VERIFICATION
    vi.stubEnv('NODE_ENV', 'production')

    const { auth } = await import('./auth')
    expect((auth as any)._config.emailAndPassword.requireEmailVerification).toBe(true)
  })

  it('requires email verification in development by default', async () => {
    delete process.env.SKIP_EMAIL_VERIFICATION
    vi.stubEnv('NODE_ENV', 'development')

    vi.resetModules()
    const { auth } = await import('./auth')
    expect((auth as any)._config.emailAndPassword.requireEmailVerification).toBe(true)
  })

  it('skips email verification only when SKIP_EMAIL_VERIFICATION=true', async () => {
    process.env.SKIP_EMAIL_VERIFICATION = 'true'
    vi.stubEnv('NODE_ENV', 'development')

    vi.resetModules()
    const { auth } = await import('./auth')
    expect((auth as any)._config.emailAndPassword.requireEmailVerification).toBe(false)
  })

  it('throws when SKIP_EMAIL_VERIFICATION=true in production', async () => {
    process.env.SKIP_EMAIL_VERIFICATION = 'true'
    vi.stubEnv('NODE_ENV', 'production')

    vi.resetModules()
    await expect(import('./auth')).rejects.toThrow('SKIP_EMAIL_VERIFICATION cannot be enabled in production')
  })
})
