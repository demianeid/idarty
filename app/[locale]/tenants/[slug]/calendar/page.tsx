import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, gte, lt, not } from 'drizzle-orm'
import { requireTenantAccess } from '@/lib/authz'
import { db } from '@/lib/db'
import { bookings, customers } from '@/lib/db/schema'
import type { Locale } from '@/lib/i18n'
import { BookingStatusActions } from '@/components/booking-status-actions'

export default async function CalendarPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const access = await requireTenantAccess(await headers(), slug).catch(() => null)
  if (!access) redirect(`/${locale}/login`)

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const rows = await db.select({ id: bookings.id, startsAt: bookings.startsAt, status: bookings.status, name: customers.fullName }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).where(and(eq(bookings.tenantId, access.tenant.id), gte(bookings.startsAt, start), lt(bookings.startsAt, end), not(eq(bookings.status, 'cancelled')))).orderBy(bookings.startsAt)
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(date.getDate() + index); return date })
  const rtl = locale === 'ar'
  const formatDay = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  const formatTime = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' })

  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f7f8fb] px-6 py-8 text-[#172033] sm:px-10"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-start justify-between gap-4"><div><a className="text-sm font-semibold text-brand-teal" href={`/${locale}/tenants/${slug}/dashboard`}>{locale === 'ar' ? 'العودة لمساحة العمل' : 'Back to workspace'}</a><h1 className="mt-4 text-3xl font-semibold tracking-tight">{locale === 'ar' ? 'التقويم والمواعيد' : 'Appointments calendar'}</h1><p className="mt-2 text-sm text-ink-muted">{locale === 'ar' ? 'نظرة أسبوعية واضحة على الحجوزات القادمة.' : 'A clear weekly view of upcoming bookings.'}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-paper px-4 py-2 text-sm font-semibold shadow-sm">{rows.length} {locale === 'ar' ? 'مواعيد' : 'bookings'}</span><a href={`/${locale}/tenants/${slug}`} target="_blank" className="rounded-full bg-[#142033] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20314d]">{locale === 'ar' ? 'إضافة موعد' : 'New booking'}</a></div></header><section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">{days.map((day) => { const dayBookings = rows.filter((booking) => booking.startsAt.toDateString() === day.toDateString()); return <article key={day.toISOString()} className="min-h-56 rounded-3xl border border-border bg-paper p-4 shadow-float"><h2 className="border-b border-border pb-3 text-sm font-semibold">{formatDay.format(day)}</h2><div className="mt-4 flex flex-col gap-2">{dayBookings.length === 0 ? <p className="rounded-2xl bg-surface px-3 py-5 text-center text-xs text-[#9aa3b2]">{locale === 'ar' ? 'متاح' : 'Available'}</p> : dayBookings.map((booking) => <div key={booking.id} className="rounded-2xl bg-[#f0faf9] p-3"><p className="text-xs font-semibold text-brand-teal">{formatTime.format(booking.startsAt)}</p><p className="mt-1 truncate text-sm font-semibold">{booking.name}</p><span className="mt-2 inline-flex rounded-full bg-paper px-2 py-1 text-[10px] font-semibold text-[#24865b]">{booking.status}</span>{booking.status === 'confirmed' && <BookingStatusActions slug={slug} bookingId={booking.id} locale={locale} />}</div>)}</div></article>})}</section></div></main>
}
