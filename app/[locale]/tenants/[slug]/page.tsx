import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { serviceTranslations, services, tenantTranslations, tenants, workingHours } from '@/lib/db/schema'

export default async function TenantPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const rtl = locale === 'ar'
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })
  if (!tenant || tenant.status !== 'active') notFound()
  const [translation, serviceRows, hoursRows] = await Promise.all([
    db.query.tenantTranslations.findFirst({ where: and(eq(tenantTranslations.tenantId, tenant.id), eq(tenantTranslations.locale, locale)) }),
    db.select({ id: services.id, name: serviceTranslations.name, durationMin: services.durationMin, priceAmount: services.priceAmount }).from(services).leftJoin(serviceTranslations, and(eq(serviceTranslations.serviceId, services.id), eq(serviceTranslations.locale, locale))).where(and(eq(services.tenantId, tenant.id), eq(services.isActive, true), isNull(services.deletedAt))).orderBy(services.sortOrder),
    db.select({ weekday: workingHours.weekday, startTime: workingHours.startTime, endTime: workingHours.endTime }).from(workingHours).where(and(eq(workingHours.tenantId, tenant.id), isNull(workingHours.staffId))).orderBy(workingHours.weekday),
  ])
  const businessName = translation?.name ?? tenant.slug
  const businessDescription = translation?.description ?? (rtl ? 'اختر الخدمة والوقت المناسبين لك.' : 'Choose a service and a time that works for you.')
  const hoursLabel = hoursRows.length ? `${hoursRows[0].startTime}–${hoursRows[0].endTime}` : (rtl ? 'حسب المواعيد المتاحة' : 'By available times')
  return <main className="min-h-screen bg-[#fbfcfe] text-[#172033]" dir={rtl ? 'rtl' : 'ltr'}>
    <header className="border-b border-[#e8ebf1] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#315efb] text-xs font-bold text-white">id</span> idarty</Link><span className="flex items-center gap-2 text-xs text-[#7d879a]"><ShieldCheck className="h-4 w-4 text-[#35a672]" />{rtl ? 'حجز آمن' : 'Secure booking'}</span></div></header>
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24"><div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><p className="flex items-center gap-2 text-sm font-semibold text-[#315efb]"><Sparkles className="h-4 w-4" />{rtl ? 'مساحة عمل موثوقة' : 'A trusted workspace'}</p><h1 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{businessName}</h1><p className="mt-6 max-w-lg text-base leading-8 text-[#6f7b90]">{businessDescription}</p><div className="mt-8 flex flex-wrap gap-5 text-sm text-[#748096]"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#315efb]" />Cairo, Egypt</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#315efb]" />{hoursLabel}</span></div><Link href={`/${locale}/tenants/${slug}/book`} className="mt-10 flex w-fit items-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,94,251,.2)]">{rtl ? 'احجز موعداً' : 'Book an appointment'}<ArrowRight className="h-4 w-4" /></Link></div><div className="rounded-[2rem] border border-[#e6eaf1] bg-white p-6 shadow-[0_20px_60px_rgba(30,45,80,.07)] sm:p-8"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{rtl ? 'الخدمات المتاحة' : 'Available services'}</p><p className="mt-1 text-xs text-[#929bad]">{rtl ? 'اختر ما يناسبك' : 'Choose what suits you'}</p></div><CalendarDays className="h-5 w-5 text-[#315efb]" /></div><div className="mt-6 space-y-3">{serviceRows.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#edf0f4] p-4"><div><p className="text-sm font-semibold">{item.name ?? (rtl ? 'خدمة' : 'Service')}</p><p className="mt-1 text-xs text-[#929bad]">{item.durationMin} min · {item.priceAmount} {tenant.currency}</p></div><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2ff] text-[#315efb]"><ArrowRight className="h-4 w-4" /></span></div>)}</div><p className="mt-6 text-center text-xs text-[#a0a8b6]">{rtl ? `المساحة: ${slug}` : `Workspace: ${slug}`}</p></div></div></section>
  </main>
}
