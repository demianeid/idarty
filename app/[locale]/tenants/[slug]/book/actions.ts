'use server'

import { and, eq, gte, isNull, lte, lt, not, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { bookings, bookingItems, customers, dateOverrides, services, serviceTranslations, staff, tenants, workingHours } from '@/lib/db/schema'

const bookingSchema = z.object({
  slug: z.string().min(2).max(80),
  locale: z.enum(['ar', 'en']),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().optional().or(z.literal('')),
  startsAt: z.string().datetime({ offset: true }),
})

export async function createPublicBooking(input: z.infer<typeof bookingSchema>) {
  const data = bookingSchema.parse(input)
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, data.slug) })
  if (!tenant) return { ok: false as const, message: data.locale === 'ar' ? 'المساحة غير موجودة.' : 'Workspace not found.' }

  const service = await db.query.services.findFirst({ where: and(eq(services.tenantId, tenant.id), eq(services.isActive, true)) })
  const person = await db.query.staff.findFirst({ where: and(eq(staff.tenantId, tenant.id), eq(staff.isActive, true)) })
  if (!service || !person) return { ok: false as const, message: data.locale === 'ar' ? 'لا توجد مواعيد متاحة حالياً.' : 'No appointments are available yet.' }

  const start = new Date(data.startsAt)
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return { ok: false as const, message: data.locale === 'ar' ? 'اختر وقتاً مستقبلياً.' : 'Choose a future time.' }
  }
  const end = new Date(start.getTime() + service.durationMin * 60_000)
  const requestedDate = start.toISOString().slice(0, 10)
  const availableSlots = await getAvailableSlots(data.slug, requestedDate)
  if (!availableSlots.includes(start.toISOString())) {
    return { ok: false as const, message: data.locale === 'ar' ? 'هذا الوقت لم يعد متاحاً. اختر وقتاً آخر.' : 'That time is no longer available. Choose another time.' }
  }
  const idempotencyKey = `public-${tenant.id}-${data.phone}-${start.toISOString()}`

  const result = await db.transaction(async (tx) => {
    const existing = await tx.query.bookings.findFirst({ where: eq(bookings.idempotencyKey, idempotencyKey) })
    if (existing) return existing
    const customer = await tx.insert(customers).values({ tenantId: tenant.id, fullName: data.fullName, nameNormalized: data.fullName.toLowerCase(), phoneE164: data.phone, email: data.email || null, preferredLocale: data.locale }).returning({ id: customers.id })
    const booking = await tx.insert(bookings).values({ tenantId: tenant.id, customerId: customer[0].id, source: 'online', locale: data.locale, idempotencyKey, startsAt: start, endsAt: end }).returning({ id: bookings.id })
    await tx.insert(bookingItems).values({ tenantId: tenant.id, bookingId: booking[0].id, serviceId: service.id, staffId: person.id, startsAt: start, endsAt: end, blockStartsAt: start, blockEndsAt: end, priceAmount: service.priceAmount })
    return booking[0]
  })
  if (data.email) {
    const { queueBookingReminder } = await import('@/lib/notifications')
    await queueBookingReminder({ tenantId: tenant.id, bookingId: result.id, recipient: data.email, locale: data.locale, startsAt: start })
    const { sendTransactionalEmail } = await import('@/lib/email/send')
    const { createBookingManageToken } = await import('@/lib/booking-manage')
    await sendTransactionalEmail({
      to: data.email,
      template: 'booking',
      locale: data.locale,
      url: `${process.env.BETTER_AUTH_URL ?? ''}/${data.locale}/manage-booking?token=${createBookingManageToken(result.id)}`,
      startsAt: start.toISOString(),
      idempotencyKey: `booking-confirmation/${result.id}`,
    }).catch((error) => console.error('[idarty] booking confirmation failed', error))
  }
  return { ok: true as const, bookingId: result.id }
}

export async function getAvailableSlots(slug: string, date: string) {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })
  if (!tenant || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return []
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  const service = await db.query.services.findFirst({ where: and(eq(services.tenantId, tenant.id), eq(services.isActive, true)) })
  const person = await db.query.staff.findFirst({ where: and(eq(staff.tenantId, tenant.id), eq(staff.isActive, true)) })
  if (!service || !person) return []
  const hours = await db.query.workingHours.findMany({ where: and(eq(workingHours.tenantId, tenant.id), eq(workingHours.weekday, day), or(isNull(workingHours.staffId), eq(workingHours.staffId, person.id))) })
  if (hours.length === 0) return []
  const overrides = await db.query.dateOverrides.findMany({ where: and(eq(dateOverrides.tenantId, tenant.id), or(isNull(dateOverrides.staffId), eq(dateOverrides.staffId, person.id)), lte(dateOverrides.startDate, date), gte(dateOverrides.endDate, date)) })
  if (overrides.some((override) => override.kind === 'closed')) return []
  const effectiveHours = overrides.some((override) => override.kind === 'custom_hours') ? overrides.filter((override) => override.kind === 'custom_hours').map((override) => ({ startTime: override.startTime!, endTime: override.endTime! })) : hours
  const busy = await db.select({ startsAt: bookingItems.startsAt, endsAt: bookingItems.endsAt }).from(bookingItems).innerJoin(bookings, eq(bookings.id, bookingItems.bookingId)).where(and(eq(bookingItems.tenantId, tenant.id), eq(bookingItems.staffId, person.id), not(eq(bookings.status, 'cancelled')), gte(bookingItems.startsAt, new Date(`${date}T00:00:00Z`)), lt(bookingItems.startsAt, new Date(`${date}T23:59:59Z`))))
  const slots: string[] = []
  for (const range of effectiveHours) {
    const [sh, sm] = range.startTime.split(':').map(Number)
    const [eh, em] = range.endTime.split(':').map(Number)
    for (let minutes = sh * 60 + sm; minutes + service.durationMin <= eh * 60 + em; minutes += 30) {
      const value = new Date(`${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00Z`)
      const end = new Date(value.getTime() + service.durationMin * 60_000)
      if (value.getTime() > Date.now() && !busy.some((item) => value < item.endsAt && end > item.startsAt)) slots.push(value.toISOString())
    }
  }
  return slots
}

export async function getPublicServices(slug: string, locale: 'ar' | 'en') {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })
  if (!tenant) return []
  return db.select({ id: services.id, name: serviceTranslations.name, durationMin: services.durationMin, priceAmount: services.priceAmount }).from(services).innerJoin(serviceTranslations, and(eq(serviceTranslations.serviceId, services.id), eq(serviceTranslations.locale, locale))).where(and(eq(services.tenantId, tenant.id), eq(services.isActive, true))).limit(20)
} 
