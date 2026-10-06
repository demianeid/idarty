import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Tests for failed-login audit privacy.
 * Verifies that the auth hook does NOT log raw email addresses on failed login attempts.
 */

// Mock the logAudit function to capture calls
const logAuditCalls: Array<{ entry: any; headers?: Headers }> = []

vi.mock('@/lib/audit', () => ({
  logAudit: async (entry: any, headers?: Headers) => {
    logAuditCalls.push({ entry, headers })
  },
}))

// Mock better-auth to test the hook in isolation
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

vi.mock('@/lib/db', () => ({
  db: {},
}))

vi.mock('@/lib/email/send', () => ({
  sendTransactionalEmail: vi.fn(),
}))

describe('failed-login audit privacy', () => {
  beforeEach(() => {
    logAuditCalls.length = 0
  })

  it('does not log raw email address on failed login', async () => {
    // Dynamically import to get the mocked version
    const { auth } = await import('./auth')
    const hook = (auth as any).hooks.after

    // Simulate a failed login attempt
    await hook({
      path: '/sign-in/email',
      status: 'unauthorized',
      body: { email: 'victim@example.com' },
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test-agent' }),
    })

    // Verify logAudit was called
    expect(logAuditCalls.length).toBe(1)
    const { entry } = logAuditCalls[0]

    // Verify the email is NOT in the audit entry
    expect(entry.entityId).toBeUndefined()
    expect(entry.action).toBe('auth.login.failure')
    expect(entry.metadata).toEqual({ reason: 'invalid_credentials' })

    // Verify headers were passed for IP/User-Agent capture
    expect(logAuditCalls[0].headers).toBeDefined()
  })

  it('logs user ID on successful login', async () => {
    const { auth } = await import('./auth')
    const hook = (auth as any).hooks.after

    await hook({
      path: '/sign-in/email',
      status: 'ok',
      user: { id: 'user-123' },
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test-agent' }),
    })

    expect(logAuditCalls.length).toBe(1)
    expect(logAuditCalls[0].entry.action).toBe('auth.login.success')
    expect(logAuditCalls[0].entry.entityId).toBe('user-123')
    expect(logAuditCalls[0].entry.actorUserId).toBe('user-123')
  })

  it('does not process non-auth paths', async () => {
    const { auth } = await import('./auth')
    const hook = (auth as any).hooks.after

    await hook({
      path: '/some-other-endpoint',
      status: 'ok',
      headers: new Headers(),
    })

    expect(logAuditCalls.length).toBe(0)
  })

  it('passes headers to logAudit for IP/User-Agent capture', async () => {
    const { auth } = await import('./auth')
    const hook = (auth as any).hooks.after

    const headers = new Headers({
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0 Test',
    })

    await hook({
      path: '/sign-in/email',
      status: 'ok',
      user: { id: 'user-456' },
      headers,
    })

    expect(logAuditCalls.length).toBe(1)
    expect(logAuditCalls[0].headers).toBe(headers)
  })
})
