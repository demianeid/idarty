"use server"

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { staff, staffTranslations } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'

const schema = z.object({ slug: z.string().min(1), locale: z.enum(['ar', 'en']), name: z.string().trim().min(2).max(80), email: z.string().email().optional().or(z.literal('')), phone: z.string().trim().max(30).optional() })

export async function createStaff(formData: FormData) {
  const input = schema.parse({ slug: formData.get('slug'), locale: formData.get('locale'), name: formData.get('name'), email: formData.get('email') ?? '', phone: formData.get('phone') ?? '' })
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')
  const created = await db.transaction(async (tx) => {
    const [person] = await tx.insert(staff).values({ tenantId: access.tenant.id, email: input.email || null, phoneE164: input.phone || null }).returning({ id: staff.id })
    await tx.insert(staffTranslations).values({ tenantId: access.tenant.id, staffId: person.id, locale: input.locale, name: input.name })
    return person
  })
  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)
  return { ok: true as const, id: created.id }
}
