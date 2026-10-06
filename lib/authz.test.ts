import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Tests for authorization failure audit logging.
 * Verifies that authorization failures are logged without breaking the flow.
 */

const logAuditCalls: Array<{ entry: any; headers?: Headers }> = []

vi.mock('@/lib/audit', () => ({
  logAudit: async (entry: any, headers?: Headers) => {
    logAuditCalls.push({ entry, headers })
  },
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => []),
          })),
        })),
      })),
    })),
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(async () => ({
    user: { id: 'user-123' },
  })),
}))

describe('authorization failure audit', () => {
  beforeEach(() => {
    logAuditCalls.length = 0
  })

  it('logs unauthorized tenant access when no membership exists', async () => {
    const { requireTenantAccess } = await import('./authz')
    const headers = new Headers({ 'x-forwarded-for': '10.0.0.1' })

    await expect(
      requireTenantAccess(headers, 'nonexistent-tenant')
    ).rejects.toThrow('FORBIDDEN')

    expect(logAuditCalls.length).toBe(1)
    const { entry } = logAuditCalls[0]

    expect(entry.action).toBe('authz.tenant.unauthorized')
    expect(entry.actorUserId).toBe('user-123')
    expect(entry.entityType).toBe('tenant')
    expect(entry.metadata).toMatchObject({
      slug: 'nonexistent-tenant',
      reason: 'no_active_membership',
    })
    // tenantId should NOT be set when no membership exists
    expect(entry.tenantId).toBeUndefined()
  })

  it('logs insufficient role when user has lower role than required', async () => {
    const { requireTenantAccess } = await import('./authz')
    const { db } = await import('@/lib/db')

    // Mock a membership with 'staff' role when 'manager' is required
    const selectMock = vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => [{
              tenant: { id: 'tenant-456', slug: 'test-tenant' },
              membership: { role: 'staff', status: 'active' },
            }]),
          })),
        })),
      })),
    }))
    ;(db as any).select = selectMock

    const headers = new Headers({ 'x-forwarded-for': '10.0.0.2' })

    await expect(
      requireTenantAccess(headers, 'test-tenant', 'manager')
    ).rejects.toThrow('FORBIDDEN')

    expect(logAuditCalls.length).toBe(1)
    const { entry } = logAuditCalls[0]

    expect(entry.action).toBe('authz.tenant.insufficient_role')
    expect(entry.actorUserId).toBe('user-123')
    expect(entry.entityId).toBe('tenant-456')
    expect(entry.tenantId).toBe('tenant-456')
    expect(entry.metadata).toMatchObject({
      slug: 'test-tenant',
      requiredRole: 'manager',
      actualRole: 'staff',
    })
  })

  it('logs unauthorized platform admin access', async () => {
    const { requirePlatformAdmin } = await import('./authz')
    const headers = new Headers({ 'x-forwarded-for': '10.0.0.3' })

    // Mock requireSession to return a non-admin user
    const { requireSession } = await import('@/lib/auth')
    ;(requireSession as any).mockResolvedValueOnce({
      user: { id: 'user-789', isPlatformAdmin: false },
    })

    await expect(
      requirePlatformAdmin(headers)
    ).rejects.toThrow('FORBIDDEN')

    expect(logAuditCalls.length).toBe(1)
    const { entry } = logAuditCalls[0]

    expect(entry.action).toBe('authz.admin.unauthorized')
    expect(entry.actorUserId).toBe('user-789')
    expect(entry.entityType).toBe('user')
    expect(entry.entityId).toBe('user-789')
    expect(entry.metadata).toEqual({ reason: 'not_platform_admin' })
  })

  it('does not log when authorization succeeds', async () => {
    const { requireTenantAccess } = await import('./authz')
    const { db } = await import('@/lib/db')

    // Mock a valid membership with sufficient role
    const selectMock = vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => [{
              tenant: { id: 'tenant-789', slug: 'valid-tenant' },
              membership: { role: 'owner', status: 'active' },
            }]),
          })),
        })),
      })),
    }))
    ;(db as any).select = selectMock

    const headers = new Headers({ 'x-forwarded-for': '10.0.0.4' })

    const result = await requireTenantAccess(headers, 'valid-tenant', 'manager')

    expect(result.tenant.id).toBe('tenant-789')
    expect(result.membership.role).toBe('owner')
    expect(logAuditCalls.length).toBe(0)
  })

  it('does not log when platform admin authorization succeeds', async () => {
    const { requirePlatformAdmin } = await import('./authz')
    const headers = new Headers({ 'x-forwarded-for': '10.0.0.5' })

    // Mock requireSession to return an admin user
    const { requireSession } = await import('@/lib/auth')
    ;(requireSession as any).mockResolvedValueOnce({
      user: { id: 'admin-123', isPlatformAdmin: true },
    })

    const result = await requirePlatformAdmin(headers)

    expect(result.user.id).toBe('admin-123')
    expect(logAuditCalls.length).toBe(0)
  })
})
