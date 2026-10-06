"use server"

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { serviceTranslations, services } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'
import { headers } from 'next/headers'
import { serviceEditPatch } from '@/lib/phase-b-policy'

const schema = z.object({ slug: z.string().min(1), locale: z.enum(['ar', 'en']), name: z.string().trim().min(2).max(80), description: z.string().trim().max(300).optional(), durationMin: z.coerce.number().int().min(15).max(480), priceAmount: z.coerce.number().min(0).max(1_000_000) })

export async function updateService(formData: FormData) {
  const input = schema.extend({ serviceId: z.string().uuid() }).parse({ slug: formData.get('slug'), locale: formData.get('locale'), name: formData.get('name'), description: formData.get('description') || undefined, durationMin: formData.get('durationMin'), priceAmount: formData.get('priceAmount'), serviceId: formData.get('serviceId') })
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')
  await db.transaction(async (tx) => {
    await tx.update(services).set({ ...serviceEditPatch(input.durationMin, input.priceAmount.toFixed(2)), updatedAt: new Date() }).where(and(eq(services.id, input.serviceId), eq(services.tenantId, access.tenant.id), eq(services.isActive, true)))
    await tx.update(serviceTranslations).set({ name: input.name, description: input.description ?? null }).where(and(eq(serviceTranslations.serviceId, input.serviceId), eq(serviceTranslations.tenantId, access.tenant.id), eq(serviceTranslations.locale, input.locale)))
  })
  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)
  revalidateTag(`tenant-public-${input.slug}-${input.locale}`, 'page')
  revalidateTag(`tenant-services-${input.slug}-${input.locale}`, 'page')
  return { ok: true as const }
}

export async function archiveService(formData: FormData) {
  const input = z.object({ slug: z.string().min(1), locale: z.enum(['ar', 'en']), serviceId: z.string().uuid() }).parse({ slug: formData.get('slug'), locale: formData.get('locale'), serviceId: formData.get('serviceId') })
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')
  await db.update(services).set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(services.id, input.serviceId), eq(services.tenantId, access.tenant.id), eq(services.isActive, true)))
  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)
  revalidateTag(`tenant-public-${input.slug}-${input.locale}`, 'page')
  revalidateTag(`tenant-services-${input.slug}-${input.locale}`, 'page')
  return { ok: true as const }
}

export async function createService(formData: FormData) {
  const input = schema.parse({ slug: formData.get('slug'), locale: formData.get('locale'), name: formData.get('name'), description: formData.get('description') || undefined, durationMin: formData.get('durationMin'), priceAmount: formData.get('priceAmount') })
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')
  const service = await db.transaction(async (tx) => {
    const [created] = await tx.insert(services).values({ tenantId: access.tenant.id, durationMin: input.durationMin, priceAmount: input.priceAmount.toFixed(2), sortOrder: 0 }).returning({ id: services.id })
    await tx.insert(serviceTranslations).values({ tenantId: access.tenant.id, serviceId: created.id, locale: input.locale, name: input.name, description: input.description ?? null })
    return created
  })
  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)
  revalidateTag(`tenant-public-${input.slug}-${input.locale}`, 'page')
  revalidateTag(`tenant-services-${input.slug}-${input.locale}`, 'page')
  return { ok: true as const, id: service.id }
}
