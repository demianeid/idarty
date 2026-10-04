'use server'

import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { bookings } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'

const inputSchema = z.object({ slug: z.string().min(2), bookingId: z.string().uuid() })

export async function cancelBooking(input: z.infer<typeof inputSchema>) {
  const data = inputSchema.parse(input)
  const access = await requireTenantAccess(await headers(), data.slug, 'manager')
  if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
    return { ok: false as const, message: 'Not authorized' }
  }
  const result = await db.update(bookings).set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() }).where(and(eq(bookings.id, data.bookingId), eq(bookings.tenantId, access.tenant.id), eq(bookings.status, 'confirmed'))).returning({ id: bookings.id })
  return result.length ? { ok: true as const } : { ok: false as const, message: 'Booking is no longer active' }
}
