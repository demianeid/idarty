'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { memberships, serviceTranslations, services, staff, staffServices, staffTranslations, tenantTranslations, tenants, workingHours } from '@/lib/db/schema'
import { businessTypes, defaultServiceName, defaultServicePreset, businessTypeLabel } from '@/lib/business-types'

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(48),
  locale: z.enum(['ar', 'en']),
  businessType: z.enum(businessTypes),
})

export async function createTenant(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const input = schema.parse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    locale: formData.get('locale') ?? 'ar',
    businessType: formData.get('businessType') ?? 'other',
  })

  const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, input.slug)).limit(1)
  if (existing.length) throw new Error('SLUG_TAKEN')

  const preset = defaultServicePreset(input.businessType)
  const [tenant] = await db.insert(tenants).values({
    slug: input.slug,
    businessType: input.businessType,
    defaultLocale: input.locale,
    supportedLocales: ['ar', 'en'],
  }).returning({ id: tenants.id, slug: tenants.slug })

  await db.transaction(async (tx) => {
    await tx.insert(tenantTranslations).values(['ar', 'en'].map((locale) => ({ tenantId: tenant.id, locale: locale as 'ar' | 'en', name: input.name, tagline: businessTypeLabel(input.businessType, locale as 'ar' | 'en') })))
    const [ownerMembership] = await tx.insert(memberships).values({ tenantId: tenant.id, userId: session.user.id, role: 'owner', status: 'active' }).returning({ id: memberships.id })
    const [defaultService] = await tx.insert(services).values({ tenantId: tenant.id, durationMin: preset.durationMin, priceAmount: preset.priceAmount, sortOrder: 0 }).returning({ id: services.id })
    await tx.insert(serviceTranslations).values(['ar', 'en'].map((locale) => ({ tenantId: tenant.id, serviceId: defaultService.id, locale: locale as 'ar' | 'en', name: defaultServiceName(input.businessType, locale as 'ar' | 'en') })))
    const [defaultStaff] = await tx.insert(staff).values({ tenantId: tenant.id, membershipId: ownerMembership.id, email: session.user.email, sortOrder: 0 }).returning({ id: staff.id })
    await tx.insert(staffTranslations).values(['ar', 'en'].map((locale) => ({ tenantId: tenant.id, staffId: defaultStaff.id, locale: locale as 'ar' | 'en', name: locale === 'ar' ? 'الفريق الرئيسي' : 'Main team' })))
    await tx.insert(staffServices).values({ tenantId: tenant.id, staffId: defaultStaff.id, serviceId: defaultService.id })
    await tx.insert(workingHours).values([0, 1, 2, 3, 4, 5].map((weekday) => ({ tenantId: tenant.id, staffId: defaultStaff.id, weekday, startTime: '09:00', endTime: '17:00' })))
  })

  redirect(`/${input.locale}/tenants/${tenant.slug}/dashboard`)
}

export async function hasTenantSlug(slug: string) {
  const rows = await db.select({ id: tenants.id }).from(tenants).where(and(eq(tenants.slug, slug), eq(tenants.status, 'active'))).limit(1)
  return rows.length > 0
}
