import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Tests for the enhanced health check endpoint.
 */

const mockExecute = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    execute: mockExecute,
    select: mockSelect,
  },
}))

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
}))

describe('health check endpoint', () => {
  beforeEach(() => {
    vi.resetModules()
    mockExecute.mockResolvedValue([{ result: 1 }])
    mockSelect.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => []),
          })),
        })),
      })),
    })
  })

  it('returns healthy status when all components are ok', async () => {
    const originalUser = process.env.GMAIL_SMTP_USER
    const originalPass = process.env.GMAIL_SMTP_APP_PASSWORD
    process.env.GMAIL_SMTP_USER = 'test@gmail.com'
    process.env.GMAIL_SMTP_APP_PASSWORD = 'test-password'

    const { GET } = await import('./route')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.components.database).toBe('healthy')
    expect(data.components.email).toBe('configured')
    expect(data.timestamp).toBeDefined()

    if (originalUser) process.env.GMAIL_SMTP_USER = originalUser
    else delete process.env.GMAIL_SMTP_USER
    if (originalPass) process.env.GMAIL_SMTP_APP_PASSWORD = originalPass
    else delete process.env.GMAIL_SMTP_APP_PASSWORD
  })

  it('returns error status when database is unhealthy', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB connection failed'))

    const { GET } = await import('./route')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('error')
    expect(data.components.database).toBe('unhealthy')
  })

  it('reports email as not configured when GMAIL_SMTP_USER is missing', async () => {
    const originalUser = process.env.GMAIL_SMTP_USER
    delete process.env.GMAIL_SMTP_USER

    const { GET } = await import('./route')
    const response = await GET()
    const data = await response.json()

    expect(data.components.email).toBe('not_configured')

    if (originalUser) process.env.GMAIL_SMTP_USER = originalUser
  })

  it('reports cron status based on last run', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => [{ status: 'succeeded', startedAt: new Date() }]),
          })),
        })),
      })),
    })

    const { GET } = await import('./route')
    const response = await GET()
    const data = await response.json()

    expect(data.components.cron).toBe('healthy')
  })

  it('reports cron as stale when last run was too long ago', async () => {
    const staleDate = new Date(Date.now() - 26 * 60 * 60 * 1000)
    mockSelect.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => [{ status: 'succeeded', startedAt: staleDate }]),
          })),
        })),
      })),
    })

    const { GET } = await import('./route')
    const response = await GET()
    const data = await response.json()

    expect(data.components.cron).toBe('stale')
  })

  it('does not expose sensitive information', async () => {
    const { GET } = await import('./route')
    const response = await GET()
    const data = await response.json()

    expect(data).not.toHaveProperty('env')
    expect(data).not.toHaveProperty('secrets')
    expect(data).not.toHaveProperty('config')
    expect(JSON.stringify(data)).not.toContain('GMAIL_SMTP_USER')
    expect(JSON.stringify(data)).not.toContain('GMAIL_SMTP_APP_PASSWORD')
    expect(JSON.stringify(data)).not.toContain('DATABASE_URL')
  })
})
