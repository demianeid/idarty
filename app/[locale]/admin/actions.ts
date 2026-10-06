'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { requirePlatformAdmin } from '@/lib/authz'
import { logAudit } from '@/lib/audit'

export async function updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'archived') {
  const session = await requirePlatformAdmin(await headers())
  await db.update(tenants).set({ status }).where(eq(tenants.id, tenantId))
  await logAudit({
    actorUserId: session.user.id,
    action: 'admin.tenant.status_change',
    entityType: 'tenant',
    entityId: tenantId,
    tenantId,
    metadata: { newStatus: status },
  }, await headers())
  revalidatePath('/[locale]/admin', 'page')
}

export async function updateTenantPlan(tenantId: string, plan: string) {
  const session = await requirePlatformAdmin(await headers())
  await db.update(tenants).set({ plan }).where(eq(tenants.id, tenantId))
  await logAudit({
    actorUserId: session.user.id,
    action: 'admin.tenant.plan_change',
    entityType: 'tenant',
    entityId: tenantId,
    tenantId,
    metadata: { newPlan: plan },
  }, await headers())
  revalidatePath('/[locale]/admin', 'page')
}
