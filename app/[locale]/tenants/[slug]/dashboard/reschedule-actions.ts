'use server'

import { headers } from 'next/headers'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { bookingItems, bookings } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'

const inputSchema = z.object({ slug: z.string().min(2), bookingId: z.string().uuid(), startsAt: z.string().datetime() })

export async function rescheduleBooking(input: z.infer<typeof inputSchema>) {
  const data = inputSchema.parse(input)
  const access = await requireTenantAccess(await headers(), data.slug, 'manager')
  if (!['owner', 'admin', 'manager'].includes(access.membership.role)) return { ok: false as const, message: 'Not authorized' }
  const item = await db.query.bookingItems.findFirst({ where: and(eq(bookingItems.bookingId, data.bookingId), eq(bookingItems.tenantId, access.tenant.id)) })
  if (!item) return { ok: false as const, message: 'Booking not found' }
  const start = new Date(data.startsAt)
  if (start <= new Date()) return { ok: false as const, message: 'Choose a future time' }
  const end = new Date(start.getTime() + (item.endsAt.getTime() - item.startsAt.getTime()))
  const conflicts = await db.query.bookingItems.findMany({ where: and(eq(bookingItems.tenantId, access.tenant.id), eq(bookingItems.staffId, item.staffId), ne(bookingItems.bookingId, data.bookingId), eq(bookingItems.status, 'confirmed')) })
  if (conflicts.some((conflict) => start < conflict.endsAt && end > conflict.startsAt)) return { ok: false as const, message: 'Time is no longer available' }
  await db.transaction(async (tx) => {
    await tx.update(bookings).set({ startsAt: start, endsAt: end, updatedAt: new Date() }).where(and(eq(bookings.id, data.bookingId), eq(bookings.tenantId, access.tenant.id), eq(bookings.status, 'confirmed')))
    await tx.update(bookingItems).set({ startsAt: start, endsAt: end, blockStartsAt: start, blockEndsAt: end }).where(and(eq(bookingItems.bookingId, data.bookingId), eq(bookingItems.tenantId, access.tenant.id)))
  })
  return { ok: true as const }
}
