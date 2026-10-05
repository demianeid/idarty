import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, gte, lt, not } from 'drizzle-orm'
import { requireTenantAccess } from '@/lib/authz'
import { db } from '@/lib/db'
import { bookings, customers } from '@/lib/db/schema'
import type { Locale } from '@/lib/i18n'

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

  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f7f8fb] px-6 py-8 text-[#172033] sm:px-10"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-start justify-between gap-4"><div><a className="text-sm font-semibold text-[#315efb]" href={`/${locale}/tenants/${slug}/dashboard`}>{locale === 'ar' ? 'العودة لمساحة العمل' : 'Back to workspace'}</a><h1 className="mt-4 text-3xl font-semibold tracking-tight">{locale === 'ar' ? 'التقويم والمواعيد' : 'Appointments calendar'}</h1><p className="mt-2 text-sm text-[#758096]">{locale === 'ar' ? 'نظرة أسبوعية واضحة على الحجوزات القادمة.' : 'A clear weekly view of upcoming bookings.'}</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm">{rows.length} {locale === 'ar' ? 'مواعيد' : 'bookings'}</span></header><section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">{days.map((day) => { const dayBookings = rows.filter((booking) => booking.startsAt.toDateString() === day.toDateString()); return <article key={day.toISOString()} className="min-h-56 rounded-3xl border border-[#e7eaf0] bg-white p-4 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><h2 className="border-b border-[#edf0f5] pb-3 text-sm font-semibold">{formatDay.format(day)}</h2><div className="mt-4 flex flex-col gap-2">{dayBookings.length === 0 ? <p className="rounded-2xl bg-[#f8faff] px-3 py-5 text-center text-xs text-[#9aa3b2]">{locale === 'ar' ? 'متاح' : 'Available'}</p> : dayBookings.map((booking) => <div key={booking.id} className="rounded-2xl bg-[#eef2ff] p-3"><p className="text-xs font-semibold text-[#315efb]">{formatTime.format(booking.startsAt)}</p><p className="mt-1 truncate text-sm font-semibold">{booking.name}</p><span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#24865b]">{booking.status}</span></div>)}</div></article>})}</section></div></main>
}
