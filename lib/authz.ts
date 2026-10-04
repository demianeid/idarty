import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { memberships, tenants } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth'

const roleRank = { receptionist: 1, staff: 2, manager: 3, admin: 4, owner: 5 } as const

export async function requireTenantAccess(headers: Headers, slug: string, minimumRole: keyof typeof roleRank = 'receptionist') {
  const session = await requireSession(headers)
  const rows = await db
    .select({ tenant: tenants, membership: memberships })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(and(eq(memberships.userId, session.user.id), eq(tenants.slug, slug), eq(memberships.status, 'active')))
    .limit(1)
  const access = rows[0]
  if (!access || roleRank[access.membership.role] < roleRank[minimumRole]) throw new Error('FORBIDDEN')
  return { session, ...access }
}
