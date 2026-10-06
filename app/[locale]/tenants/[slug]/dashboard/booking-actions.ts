'use server'

import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { bookings, customers } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'
import { logAudit } from '@/lib/audit'

const inputSchema = z.object({ slug: z.string().min(2), bookingId: z.string().uuid() })

export async function cancelBooking(input: z.infer<typeof inputSchema>) {
  const data = inputSchema.parse(input)
  const access = await requireTenantAccess(await headers(), data.slug, 'manager')
  if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
    return { ok: false as const, message: 'Not authorized' }
  }
  const booking = await db.select({ id: bookings.id, startsAt: bookings.startsAt, locale: bookings.locale, email: customers.email }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).where(and(eq(bookings.id, data.bookingId), eq(bookings.tenantId, access.tenant.id), eq(bookings.status, 'confirmed'))).limit(1)
  const result = await db.update(bookings).set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() }).where(and(eq(bookings.id, data.bookingId), eq(bookings.tenantId, access.tenant.id), eq(bookings.status, 'confirmed'))).returning({ id: bookings.id })
  if (result.length) {
    await logAudit({
      actorUserId: access.session.user.id,
      action: 'booking.cancelled',
      entityType: 'booking',
      entityId: data.bookingId,
      tenantId: access.tenant.id,
    }, await headers())
  }
  if (result.length && booking[0]?.email) {
    const [{ sendTransactionalEmail }, { createBookingManageToken }] = await Promise.all([import('@/lib/email/send'), import('@/lib/booking-manage')])
    await sendTransactionalEmail({
      to: booking[0].email,
      template: 'cancellation',
      locale: booking[0].locale,
      url: `${process.env.BETTER_AUTH_URL ?? ''}/${booking[0].locale}/manage-booking?token=${createBookingManageToken(booking[0].id)}`,
      startsAt: booking[0].startsAt.toISOString(),
      idempotencyKey: `booking-cancellation/${booking[0].id}/${new Date().toISOString()}`,
    }).catch((error) => console.error('[idarty] booking cancellation failed', error))
  }
  return result.length ? { ok: true as const } : { ok: false as const, message: 'Booking is no longer active' }
}

export async function markNoShow(input: z.infer<typeof inputSchema>) {
  const data = inputSchema.parse(input)
  const access = await requireTenantAccess(await headers(), data.slug, 'manager')
  if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
    return { ok: false as const, message: 'Not authorized' }
  }
  const result = await db.update(bookings).set({ status: 'no_show', updatedAt: new Date() }).where(and(eq(bookings.id, data.bookingId), eq(bookings.tenantId, access.tenant.id), eq(bookings.status, 'confirmed'))).returning({ id: bookings.id })
  if (result.length) {
    await logAudit({
      actorUserId: access.session.user.id,
      action: 'booking.no_show',
      entityType: 'booking',
      entityId: data.bookingId,
      tenantId: access.tenant.id,
    }, await headers())
  }
  return result.length ? { ok: true as const } : { ok: false as const, message: 'Booking is no longer active' }
}
