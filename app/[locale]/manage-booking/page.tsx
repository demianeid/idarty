import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, customers, tenants } from '@/lib/db/schema'
import type { Locale } from '@/lib/i18n'
import { verifyBookingManageToken } from '@/lib/booking-manage'
import { ManageBookingAction } from '@/components/manage-booking-action'

export default async function ManageBookingPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params
  const { token = '' } = await searchParams
  const id = verifyBookingManageToken(token)
  const record = id ? await db.select({ id: bookings.id, startsAt: bookings.startsAt, status: bookings.status, name: customers.fullName, tenantName: tenants.slug }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).innerJoin(tenants, eq(tenants.id, bookings.tenantId)).where(eq(bookings.id, id)).limit(1) : []
  const booking = record[0]
  const rtl = locale === 'ar'
  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8faff] px-5 py-16 text-[#142033]"><div className="mx-auto max-w-lg rounded-3xl border border-[#e7eaf0] bg-white p-8 shadow-[0_18px_50px_rgba(30,45,80,.06)]"><p className="text-sm font-semibold text-[#315efb]">idarty</p><h1 className="mt-3 text-2xl font-semibold">{booking ? (rtl ? 'إدارة موعدك' : 'Manage your appointment') : (rtl ? 'الرابط غير صالح' : 'Invalid booking link')}</h1>{booking && <><p className="mt-4 text-sm text-[#758096]">{booking.name} · {booking.tenantName}</p><p className="mt-2 font-semibold">{new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-US', { dateStyle: 'full', timeStyle: 'short' }).format(booking.startsAt)}</p><p className="mt-3 text-sm">{booking.status}</p>{booking.status === 'confirmed' && <ManageBookingAction locale={locale} token={token} />}</>}</div></main>
}
