import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, customers, tenants } from '@/lib/db/schema'
import type { Locale } from '@/lib/i18n'

export default async function BookingConfirmedPage({ params, searchParams }: { params: Promise<{ locale: Locale; slug: string }>; searchParams: Promise<{ booking?: string }> }) {
  const { locale, slug } = await params
  const { booking } = await searchParams
  const rtl = locale === 'ar'
  const record = booking && /^[0-9a-f-]{36}$/i.test(booking) ? await db.select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, name: customers.fullName, tenantSlug: tenants.slug }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).innerJoin(tenants, eq(tenants.id, bookings.tenantId)).where(and(eq(bookings.id, booking), eq(tenants.slug, slug))).limit(1) : []
  const item = record[0]
  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#fbfcfe] px-6 py-16 text-[#172033]"><div className="mx-auto max-w-xl rounded-[2rem] border border-[#e6eaf1] bg-white p-8 text-center shadow-[0_20px_60px_rgba(30,45,80,.07)]"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf8f1] text-[#24865b]"><CheckCircle2 className="h-7 w-7" /></span><h1 className="mt-6 text-2xl font-semibold">{rtl ? 'تم تأكيد موعدك' : 'Your appointment is confirmed'}</h1>{item ? <p className="mt-3 text-sm leading-7 text-[#758096]">{item.name} · {new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-US', { dateStyle: 'full', timeStyle: 'short' }).format(item.startsAt)}</p> : <p className="mt-3 text-sm text-[#758096]">{rtl ? 'تم إنشاء الحجز بنجاح.' : 'Your booking was created successfully.'}</p>}<Link href={`/${locale}/tenants/${slug}`} className="mt-8 inline-flex rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white">{rtl ? 'العودة إلى الصفحة' : 'Back to workspace'}</Link></div></main>
}
