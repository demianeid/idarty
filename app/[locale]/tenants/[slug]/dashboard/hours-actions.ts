"use server"

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { headers } from 'next/headers'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { workingHours } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'

const schema = z.object({ slug: z.string().min(1), locale: z.enum(['ar', 'en']), weekday: z.coerce.number().int().min(0).max(6), startTime: z.string().optional().default(''), endTime: z.string().optional().default(''), closed: z.coerce.boolean().default(false) })

export async function saveWorkingHours(formData: FormData) {
  const input = schema.parse({ slug: formData.get('slug'), locale: formData.get('locale'), weekday: formData.get('weekday'), startTime: formData.get('startTime') || '', endTime: formData.get('endTime') || '', closed: formData.get('closed') ?? false })

  if (!input.closed) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime)) throw new Error('Invalid start time')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime)) throw new Error('Invalid end time')
    if (input.startTime >= input.endTime) throw new Error('End time must be after start time')
  }
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')
  await db.transaction(async (tx) => {
    await tx.delete(workingHours).where(and(eq(workingHours.tenantId, access.tenant.id), eq(workingHours.weekday, input.weekday), isNull(workingHours.staffId)))
    if (!input.closed) await tx.insert(workingHours).values({ tenantId: access.tenant.id, staffId: null, weekday: input.weekday, startTime: input.startTime, endTime: input.endTime })
  })
  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)
  revalidateTag(`tenant-public-${input.slug}-${input.locale}`, 'max')
  return { ok: true as const }
}
