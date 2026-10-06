'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { requirePlatformAdmin } from '@/lib/authz'

export async function updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'archived') {
  await requirePlatformAdmin(await headers())
  await db.update(tenants).set({ status }).where(eq(tenants.id, tenantId))
  revalidatePath('/[locale]/admin', 'page')
}

export async function updateTenantPlan(tenantId: string, plan: string) {
  await requirePlatformAdmin(await headers())
  await db.update(tenants).set({ plan }).where(eq(tenants.id, tenantId))
  revalidatePath('/[locale]/admin', 'page')
}
