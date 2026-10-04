import 'server-only'

import { and, eq, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

export async function queueBookingReminder(input: {
  tenantId: string
  bookingId: string
  recipient: string
  locale: 'ar' | 'en'
  startsAt: Date
}) {
  const scheduledAt = new Date(input.startsAt.getTime() - 24 * 60 * 60 * 1000)
  if (scheduledAt <= new Date()) return
  await db.insert(notifications).values({
    tenantId: input.tenantId,
    bookingId: input.bookingId,
    type: 'booking_reminder',
    channel: 'email',
    locale: input.locale,
    recipient: input.recipient,
    dedupeKey: `booking-reminder/${input.bookingId}/${input.startsAt.toISOString()}`,
    scheduledAt,
  }).onConflictDoNothing()
}

export async function claimDueReminders(limit = 25) {
  const now = new Date()
  return db.transaction(async (tx) => {
    const due = await tx.select().from(notifications).where(and(eq(notifications.status, 'pending'), lte(notifications.scheduledAt, now))).limit(limit)
    for (const notification of due) {
      await tx.update(notifications).set({ status: 'processing', lockedAt: now, attempts: notification.attempts + 1 }).where(and(eq(notifications.id, notification.id), eq(notifications.status, 'pending')))
    }
    return due
  })
}
