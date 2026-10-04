"use server"

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { dateOverrides } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'

const schema = z.object({ slug: z.string().min(1), locale: z.enum(['ar', 'en']), startDate: z.string().date(), endDate: z.string().date(), kind: z.enum(['closed', 'custom_hours']), startTime: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/).optional(), endTime: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/).optional(), label: z.string().trim().max(120).optional() })

export async function createDateOverride(formData: FormData) {
  const input = schema.parse(Object.fromEntries(formData))
  if (input.endDate < input.startDate) throw new Error('End date must be on or after start date')
  if (input.kind === 'custom_hours' && (!input.startTime || !input.endTime || input.startTime >= input.endTime)) throw new Error('Custom hours must have a valid range')
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')
  await db.insert(dateOverrides).values({ tenantId: access.tenant.id, staffId: null, startDate: input.startDate, endDate: input.endDate, kind: input.kind, startTime: input.kind === 'custom_hours' ? input.startTime : null, endTime: input.kind === 'custom_hours' ? input.endTime : null, label: input.label || null })
  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)
  revalidatePath(`/${input.locale}/tenants/${input.slug}/book`)
  return { ok: true as const }
}
