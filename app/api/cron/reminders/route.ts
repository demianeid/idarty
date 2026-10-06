import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, customers, notifications, tenants } from '@/lib/db/schema'
import { claimDueReminders } from '@/lib/notifications'
import { createBookingManageToken } from '@/lib/booking-manage'
import { sendTransactionalEmail } from '@/lib/email/send'

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  if (authorization !== `Bearer ${process.env.CRON_SECRET}` || !process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const due = await claimDueReminders()
  let sent = 0
  for (const notification of due) {
    try {
      const details = notification.bookingId ? (await db.select({ email: customers.email, startsAt: bookings.startsAt, slug: tenants.slug }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).innerJoin(tenants, eq(tenants.id, bookings.tenantId)).where(eq(bookings.id, notification.bookingId)).limit(1))[0] : null
      if (!details?.email || !details.startsAt) {
        await db.update(notifications).set({ status: 'skipped', lastError: 'Recipient unavailable' }).where(eq(notifications.id, notification.id))
        continue
      }
      await sendTransactionalEmail({ to: details.email, locale: notification.locale, template: 'reminder', startsAt: details.startsAt.toISOString(), url: `${process.env.BETTER_AUTH_URL ?? ''}/${notification.locale}/manage-booking?token=${createBookingManageToken(notification.bookingId!)}`, idempotencyKey: `notification/${notification.id}` })
      await db.update(notifications).set({ status: 'sent', sentAt: new Date(), providerMessageId: notification.id }).where(and(eq(notifications.id, notification.id), eq(notifications.status, 'processing')))
      sent++
    } catch (error) {
      await db.update(notifications).set({ status: notification.attempts >= 3 ? 'failed' : 'pending', lastError: error instanceof Error ? error.message : 'Unknown error' }).where(eq(notifications.id, notification.id))
    }
  }
  return NextResponse.json({ claimed: due.length, sent })
}
