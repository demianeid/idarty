'use server'

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'
import type { Locale } from '@/lib/i18n'

const schema = z.object({
  slug: z.string().min(2),
  locale: z.enum(['ar', 'en']),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoBase64: z.string().optional(),
})

export async function saveBrandingColors(input: z.infer<typeof schema>) {
  const data = schema.parse(input)
  const access = await requireTenantAccess(await headers(), data.slug, 'admin')
  if (!['owner', 'admin'].includes(access.membership.role)) {
    return { ok: false as const, message: 'Not authorized' }
  }

  const current = await db.query.tenants.findFirst({ where: eq(tenants.slug, data.slug) })
  const currentTheme = (current?.theme ?? {}) as Record<string, string>

  await db.update(tenants).set({
    theme: { ...currentTheme, primaryColor: data.primaryColor, accentColor: data.accentColor, logo: data.logoBase64 ?? currentTheme.logo },
    updatedAt: new Date(),
  }).where(eq(tenants.id, access.tenant.id))

  revalidatePath(`/${data.locale}/tenants/${data.slug}/dashboard`)
  revalidatePath(`/${data.locale}/tenants/${data.slug}`)

  return { ok: true as const }
}
