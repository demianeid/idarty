import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/email/send', () => ({ sendTransactionalEmail: vi.fn() }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn() }))

describe('auth baseURL resolution', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    // Clear relevant environment variables
    delete process.env.BETTER_AUTH_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_URL
    delete process.env.V0_RUNTIME_URL
    delete (process.env as any).NODE_ENV
    delete process.env.VERCEL_ENV
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('uses BETTER_AUTH_URL if provided', async () => {
    process.env.BETTER_AUTH_URL = 'https://custom-auth.example.com'
    const { publicOrigin } = await import('./auth')
    expect(publicOrigin()).toBe('https://custom-auth.example.com')
  })

  it('adds https protocol if missing from BETTER_AUTH_URL', async () => {
    process.env.BETTER_AUTH_URL = 'custom-auth.example.com'
    const { publicOrigin } = await import('./auth')
    expect(publicOrigin()).toBe('https://custom-auth.example.com')
  })

  it('uses VERCEL_PROJECT_PRODUCTION_URL over localhost', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'v0-idarty.vercel.app'
    const { publicOrigin } = await import('./auth')
    expect(publicOrigin()).toBe('https://v0-idarty.vercel.app')
  })

  it('uses localhost in non-production environments when no URL is provided', async () => {
    ;(process.env as any).NODE_ENV = 'development'
    const { publicOrigin } = await import('./auth')
    expect(publicOrigin()).toBe('http://localhost:3000')
  })

  it('throws an error in production if no URL is provided (NODE_ENV)', async () => {
    ;(process.env as any).NODE_ENV = 'production'
    await expect(import('./auth')).rejects.toThrow(
      'BETTER_AUTH_URL or a Vercel environment URL is required in production environment.'
    )
  })

  it('throws an error in production if no URL is provided (VERCEL_ENV)', async () => {
    process.env.VERCEL_ENV = 'production'
    await expect(import('./auth')).rejects.toThrow(
      'BETTER_AUTH_URL or a Vercel environment URL is required in production environment.'
    )
  })
})
