import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { serviceTranslations, services, tenantTranslations, tenants, workingHours } from '@/lib/db/schema'
import { shouldShowPublicWorkingHour } from '@/lib/public-hours-policy'
import { LogoIcon } from '@/components/logo'

const WEEKDAY_LABELS: Record<string, { ar: string; en: string }> = {
  '0': { ar: 'الأحد', en: 'Sun' },
  '1': { ar: 'الإثنين', en: 'Mon' },
  '2': { ar: 'الثلاثاء', en: 'Tue' },
  '3': { ar: 'الأربعاء', en: 'Wed' },
  '4': { ar: 'الخميس', en: 'Thu' },
  '5': { ar: 'الجمعة', en: 'Fri' },
  '6': { ar: 'السبت', en: 'Sat' },
}

export default async function TenantPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const rtl = locale === 'ar'
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })
  if (!tenant) notFound()
  if (tenant.status === 'suspended') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6 text-center text-[#172033]" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">{rtl ? 'الصفحة غير متاحة' : 'Page Unavailable'}</h1>
          <p className="text-ink-muted">
            {rtl 
              ? 'مساحة العمل هذه غير متاحة حالياً لتلقي الحجوزات.' 
              : 'This workspace is currently unavailable for bookings.'}
          </p>
        </div>
      </div>
    )
  }

  const [translation, serviceRows, rawHoursRows] = await Promise.all([
    db.query.tenantTranslations.findFirst({ where: and(eq(tenantTranslations.tenantId, tenant.id), eq(tenantTranslations.locale, locale)) }),
    db.select({ id: services.id, name: serviceTranslations.name, durationMin: services.durationMin, priceAmount: services.priceAmount }).from(services).leftJoin(serviceTranslations, and(eq(serviceTranslations.serviceId, services.id), eq(serviceTranslations.locale, locale))).where(and(eq(services.tenantId, tenant.id), eq(services.isActive, true), eq(services.isSample, false), isNull(services.deletedAt))).orderBy(services.sortOrder),
    db.select({ weekday: workingHours.weekday, startTime: workingHours.startTime, endTime: workingHours.endTime, isSample: workingHours.isSample }).from(workingHours).where(and(eq(workingHours.tenantId, tenant.id), isNull(workingHours.staffId))).orderBy(workingHours.weekday),
  ])
  const hoursRows = rawHoursRows.filter((hour) => shouldShowPublicWorkingHour(hour.isSample))

  const businessName = translation?.name ?? tenant.slug
  const businessTagline = translation?.tagline ?? (rtl ? 'مساحة عمل موثوقة' : 'A trusted workspace')
  const businessDescription = translation?.description ?? (rtl ? 'اختر الخدمة والوقت المناسبين لك.' : 'Choose a service and a time that works for you.')
  const businessAddress = translation?.address ?? null
  const businessPhone = tenant.phoneE164 ?? null

  // Build a compact hours summary e.g. "Sun–Thu: 09:00–17:00"
  let hoursLabel: string
  if (hoursRows.length === 0) {
    hoursLabel = rtl ? 'حسب المواعيد المتاحة' : 'By available times'
  } else {
    const first = hoursRows[0]
    const last = hoursRows[hoursRows.length - 1]
    const firstDay = WEEKDAY_LABELS[String(first.weekday)]?.[locale] ?? ''
    const lastDay = hoursRows.length > 1 ? (WEEKDAY_LABELS[String(last.weekday)]?.[locale] ?? '') : ''
    const dayRange = lastDay && lastDay !== firstDay ? `${firstDay}–${lastDay}` : firstDay
    hoursLabel = `${dayRange}: ${first.startTime.slice(0, 5)}–${first.endTime.slice(0, 5)}`
  }

  const durationLabel = (min: number) => {
    if (rtl) return `${min} دقيقة`
    return min >= 60 ? `${min / 60}h` : `${min} min`
  }

  const theme = (tenant.theme as Record<string, string> | null) ?? {}
  const primaryColor = theme.primaryColor ?? '#0F766E'
  const accentColor = theme.accentColor ?? '#f0faf9'
  const logo = theme.logo ?? ''

  return <main className="min-h-screen bg-[#fbfcfe] text-[#172033]" dir={rtl ? 'rtl' : 'ltr'} style={{ '--primary': primaryColor, '--accent': accentColor } as React.CSSProperties}>
    <header className="border-b border-[#e8ebf1] bg-paper"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold">{logo ? <img src={logo} alt={businessName} className="h-8 w-auto object-contain" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>{businessName.charAt(0).toUpperCase()}</span>} {businessName}</Link>
      <span className="flex items-center gap-2 text-xs text-[#7d879a]"><ShieldCheck className="h-4 w-4 text-[#35a672]" />{rtl ? 'حجز آمن' : 'Secure booking'}</span>
    </div></header>
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24"><div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div>
      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}><Sparkles className="h-4 w-4" />{businessTagline}</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{businessName}</h1>
      <p className="mt-6 max-w-lg text-base leading-8 text-[#6f7b90]">{businessDescription}</p>
      <div className="mt-8 flex flex-wrap gap-5 text-sm text-[#748096]">
        {businessAddress && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: 'var(--primary)' }} />{businessAddress}</span>}
        <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" style={{ color: 'var(--primary)' }} />{hoursLabel}</span>
        {businessPhone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: 'var(--primary)' }} />{businessPhone}</span>}
      </div>
      <Link href={`/${locale}/tenants/${slug}/book`} className="mt-10 flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: 'var(--primary)' }}>{rtl ? 'احجز موعداً' : 'Book an appointment'}<ArrowRight className="h-4 w-4" /></Link>
    </div>
    <div className="rounded-[2rem] border border-[#e6eaf1] bg-paper p-6 shadow-[0_20px_60px_rgba(30,45,80,.07)] sm:p-8">
      <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{rtl ? 'الخدمات المتاحة' : 'Available services'}</p><p className="mt-1 text-xs text-[#929bad]">{rtl ? 'اختر ما يناسبك' : 'Choose what suits you'}</p></div><CalendarDays className="h-5 w-5" style={{ color: 'var(--primary)' }} /></div>
      <div className="mt-6 space-y-3">
        {serviceRows.length === 0
          ? <p className="rounded-2xl bg-surface py-8 text-center text-sm text-[#a0a8b6]">{rtl ? 'لا توجد خدمات متاحة حالياً' : 'No services available yet'}</p>
          : serviceRows.map((item) => <Link key={item.id} href={`/${locale}/tenants/${slug}/book?service=${item.id}`} className="group flex items-center justify-between rounded-2xl border border-[#edf0f4] p-4 transition hover:shadow-sm" style={{ '--hover-border': primaryColor } as React.CSSProperties}><div><p className="text-sm font-semibold">{item.name ?? (rtl ? 'خدمة' : 'Service')}</p><p className="mt-1 text-xs text-[#929bad]">{durationLabel(item.durationMin)} · {item.priceAmount} {tenant.currency}</p></div><span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}><ArrowRight className="h-4 w-4" /></span></Link>)
        }
      </div>
    {tenant.email && <p className="mt-6 text-center text-xs text-[#a0a8b6]">{tenant.email}</p>}
    </div></div></section>
    {/* Powered by Idarty – small attribution on tenant pages */}
    <footer className="border-t border-border bg-paper py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6">
        <span className="text-xs text-[#a0a8b6]">{rtl ? 'مدعوم بواسطة' : 'Powered by'}</span>
        <Link href="/" className="flex items-center gap-1 text-xs font-semibold text-brand-teal" aria-label="Idarty">
          <LogoIcon height={14} />
          <span>{rtl ? 'إدارتي' : 'Idarty'}</span>
        </Link>
      </div>
    </footer>
  </main>
}

