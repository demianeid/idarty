import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, count, desc, eq, gte, isNull, lt, not } from 'drizzle-orm'
import { CalendarDays, ClipboardList, Users, Settings2 } from 'lucide-react'
import { requireTenantAccess } from '@/lib/authz'
import { db } from '@/lib/db'
import { bookings, customers, services } from '@/lib/db/schema'
import type { Locale } from '@/lib/i18n'
import { serviceTranslations } from '@/lib/db/schema'
import { ServiceForm } from '@/components/service-form'
import { ServiceArchiveButton } from '@/components/service-archive-button'
import { WorkingHoursForm } from '@/components/working-hours-form'
import { BookingStatusActions } from '@/components/booking-status-actions'
import { StaffForm } from '@/components/staff-form'
import { DateOverrideForm } from '@/components/date-override-form'
import { SignOutButton } from '@/components/sign-out-button'
import { dateOverrides, staff, staffTranslations, workingHours } from '@/lib/db/schema'

const copy = {
  ar: { title: 'مساحة العمل', subtitle: 'نظرة هادئة على يومك وإدارة فريقك.', appointments: 'مواعيد اليوم', customers: 'العملاء', services: 'الخدمات', settings: 'الإعدادات', empty: 'لا توجد مواعيد اليوم بعد.' },
  en: { title: 'Workspace', subtitle: 'A calm view of your day and your team.', appointments: "Today's appointments", customers: 'Customers', services: 'Services', settings: 'Settings', empty: 'No appointments scheduled today.' },
} as const

export default async function TenantDashboard({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const rtl = locale === 'ar'
  const t = copy[locale]
  let access
  try {
    access = await requireTenantAccess(await headers(), slug)
  } catch {
    redirect(`/${locale}/login`)
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)
  const endOfWeek = new Date(startOfDay)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  const [appointmentCount, customerCount, serviceCount, customerRows, todayBookings, upcomingBookings, serviceRows, hoursRows, staffRows, overrideRows] = await Promise.all([
    db.select({ value: count() }).from(bookings).where(and(eq(bookings.tenantId, access.tenant.id), gte(bookings.startsAt, startOfDay), lt(bookings.startsAt, endOfDay), not(eq(bookings.status, 'cancelled')))),
    db.select({ value: count() }).from(customers).where(eq(customers.tenantId, access.tenant.id)),
    db.select({ value: count() }).from(services).where(and(eq(services.tenantId, access.tenant.id), eq(services.isActive, true))),
    db.select({ id: customers.id, name: customers.fullName, phone: customers.phoneE164, email: customers.email, createdAt: customers.createdAt }).from(customers).where(and(eq(customers.tenantId, access.tenant.id), isNull(customers.deletedAt))).orderBy(desc(customers.createdAt)).limit(12),
    db.select({ id: bookings.id, startsAt: bookings.startsAt, status: bookings.status, name: customers.fullName }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).where(and(eq(bookings.tenantId, access.tenant.id), gte(bookings.startsAt, startOfDay), lt(bookings.startsAt, endOfDay), not(eq(bookings.status, 'cancelled')))).orderBy(bookings.startsAt),
    db.select({ id: bookings.id, startsAt: bookings.startsAt, status: bookings.status, name: customers.fullName }).from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId)).where(and(eq(bookings.tenantId, access.tenant.id), gte(bookings.startsAt, endOfDay), lt(bookings.startsAt, endOfWeek), not(eq(bookings.status, 'cancelled')))).orderBy(bookings.startsAt).limit(10),
    db.select({ id: services.id, durationMin: services.durationMin, priceAmount: services.priceAmount, name: serviceTranslations.name }).from(services).leftJoin(serviceTranslations, and(eq(serviceTranslations.serviceId, services.id), eq(serviceTranslations.locale, locale))).where(and(eq(services.tenantId, access.tenant.id), eq(services.isActive, true))).orderBy(services.sortOrder),
    db.select({ weekday: workingHours.weekday, startTime: workingHours.startTime, endTime: workingHours.endTime }).from(workingHours).where(and(eq(workingHours.tenantId, access.tenant.id), isNull(workingHours.staffId))),
    db.select({ id: staff.id, name: staffTranslations.name, email: staff.email, phone: staff.phoneE164 }).from(staff).leftJoin(staffTranslations, and(eq(staffTranslations.staffId, staff.id), eq(staffTranslations.locale, locale))).where(and(eq(staff.tenantId, access.tenant.id), eq(staff.isActive, true), isNull(staff.deletedAt))).orderBy(staff.sortOrder),
    db.select({ id: dateOverrides.id, startDate: dateOverrides.startDate, endDate: dateOverrides.endDate, kind: dateOverrides.kind, label: dateOverrides.label, startTime: dateOverrides.startTime, endTime: dateOverrides.endTime }).from(dateOverrides).where(and(eq(dateOverrides.tenantId, access.tenant.id), isNull(dateOverrides.staffId))).orderBy(dateOverrides.startDate),
  ])

  const checklist = [
    { done: serviceCount[0]?.value > 0, label: rtl ? 'أضف خدمتك الأولى' : 'Add your first service', href: '#services' },
    { done: staffRows.length > 0, label: rtl ? 'أضف عضو فريق' : 'Add a team member', href: '#staff' },
    { done: hoursRows.length > 0, label: rtl ? 'حدد ساعات العمل' : 'Set working hours', href: '#hours' },
    { done: true, label: rtl ? 'شارك رابط الحجز العام' : 'Share your public booking link', href: `/${locale}/tenants/${slug}` },
  ]

  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f7f8fb] text-[#172033]">
    <div className="mx-auto flex min-h-screen max-w-7xl">
      <aside className="hidden w-64 border-e border-[#e7eaf0] bg-white p-5 lg:block">
        <div className="flex items-center gap-2 text-sm font-bold text-[#315efb]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315efb] text-white">id</span> idarty</div>
        <div className="mt-10 rounded-2xl bg-[#f5f7ff] p-4"><p className="text-xs text-[#8993a5]">{t.title}</p><p className="mt-1 truncate text-sm font-semibold">{access.tenant.slug}</p></div>
        <nav className="mt-8 space-y-1 text-sm"><a className="flex items-center gap-3 rounded-xl bg-[#315efb] px-3 py-3 font-semibold text-white" href={`/${locale}/tenants/${slug}/calendar`}><CalendarDays className="h-4 w-4" />{t.appointments}</a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#647087] hover:bg-[#f7f8fb]" href="#customers"><Users className="h-4 w-4" />{t.customers}</a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#647087] hover:bg-[#f7f8fb]" href="#services"><ClipboardList className="h-4 w-4" />{t.services}</a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#647087] hover:bg-[#f7f8fb]" href="#settings"><Settings2 className="h-4 w-4" />{t.settings}</a></nav>
      </aside>
      <section className="min-w-0 flex-1 p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-[#8993a5]">{access.session.user.name}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.title}</h1><p className="mt-2 text-sm text-[#758096]">{t.subtitle}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#eaf8f1] px-3 py-1.5 text-xs font-semibold text-[#24865b]">{access.membership.role}</span><SignOutButton label={rtl ? 'تسجيل الخروج' : 'Sign out'} /></div></header>
        <div className="mt-9 grid gap-4 sm:grid-cols-3"><Stat icon={<CalendarDays className="h-5 w-5" />} label={t.appointments} value={String(appointmentCount[0]?.value ?? 0)} /><Stat icon={<Users className="h-5 w-5" />} label={t.customers} value={String(customerCount[0]?.value ?? 0)} /><Stat icon={<ClipboardList className="h-5 w-5" />} label={t.services} value={String(serviceCount[0]?.value ?? 0)} /></div>
        <div className="mt-6 rounded-3xl border border-[#dfe5ff] bg-[#f5f7ff] p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{rtl ? 'خطوات البدء' : 'Getting started'}</h2><p className="mt-1 text-sm text-[#758096]">{rtl ? 'أكمل هذه الخطوات لتجهيز مساحة العمل.' : 'Complete these steps to prepare your workspace.'}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#315efb]">{checklist.filter((item) => item.done).length}/{checklist.length}</span></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{checklist.map((item) => <a key={item.label} href={item.href} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold transition hover:shadow-sm"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${item.done ? 'bg-[#dff5e9] text-[#24865b]' : 'border border-[#cbd5ee] text-transparent'}`}>{item.done ? '✓' : '·'}</span>{item.label}</a>)}</div></div>
        <div id="appointments" className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><h2 className="text-lg font-semibold">{t.appointments}</h2><div className="mt-6 space-y-3">{todayBookings.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dfe4ee] px-5 py-12 text-center text-sm text-[#8993a5]">{t.empty}</div> : todayBookings.map((booking) => <div key={booking.id} className="flex items-center justify-between rounded-2xl bg-[#f8faff] px-4 py-4"><div><p className="font-semibold">{booking.name}</p><p className="mt-1 text-xs text-[#8993a5]">{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(booking.startsAt)}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#eaf8f1] px-3 py-1 text-xs font-semibold text-[#24865b]">{booking.status}</span>{booking.status === 'confirmed' && <BookingStatusActions slug={slug} bookingId={booking.id} locale={locale} />}</div></div>)}</div></div>
        <div className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{locale === 'ar' ? 'المواعيد القادمة' : 'Upcoming bookings'}</h2><p className="mt-1 text-sm text-[#758096]">{locale === 'ar' ? 'نظرة على الأيام السبعة القادمة.' : 'A view of the next seven days.'}</p></div><span className="rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-semibold text-[#b86a12]">{upcomingBookings.length}</span></div><div className="mt-5 space-y-2">{upcomingBookings.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dfe4ee] px-5 py-10 text-center text-sm text-[#8993a5]">{locale === 'ar' ? 'لا توجد مواعيد قادمة.' : 'No upcoming bookings.'}</div> : upcomingBookings.map((booking) => <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8faff] px-4 py-3"><div><p className="font-semibold">{booking.name}</p><p className="mt-1 text-xs text-[#8993a5]">{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(booking.startsAt)}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#eaf8f1] px-3 py-1 text-xs font-semibold text-[#24865b]">{booking.status}</span>{booking.status === 'confirmed' && <BookingStatusActions slug={slug} bookingId={booking.id} locale={locale} />}</div></div>)}</div></div>
        <div id="customers" className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{t.customers}</h2><p className="mt-1 text-sm text-[#758096]">{locale === 'ar' ? 'آخر العملاء الذين حجزوا معك.' : 'The latest customers who booked with you.'}</p></div><span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#315efb]">{customerCount[0]?.value ?? 0}</span></div><div className="mt-5 divide-y divide-[#edf0f5]">{customerRows.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dfe4ee] px-5 py-10 text-center text-sm text-[#8993a5]">{locale === 'ar' ? 'لا يوجد عملاء بعد.' : 'No customers yet.'}</div> : customerRows.map((customer) => <div key={customer.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="font-semibold">{customer.name}</p><p className="mt-1 text-xs text-[#8993a5]">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p></div><p className="text-xs text-[#8993a5]">{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(customer.createdAt)}</p></div>)}</div></div>
        <div id="services" className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{t.services}</h2><p className="mt-1 text-sm text-[#758096]">{locale === 'ar' ? 'أدر الخدمات التي يمكن حجزها من موقعك.' : 'Manage services customers can book.'}</p></div><span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#315efb]">{serviceRows.length}</span></div><div className="mt-5 space-y-2">{serviceRows.map((service) => <div key={service.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8faff] px-4 py-3"><div><p className="font-semibold">{service.name ?? (locale === 'ar' ? 'خدمة بدون ترجمة' : 'Untitled service')}</p><p className="mt-1 text-xs text-[#8993a5]">{service.durationMin} {locale === 'ar' ? 'دقيقة' : 'min'} · {service.priceAmount} {access.tenant.currency}</p></div><ServiceArchiveButton slug={slug} locale={locale} serviceId={service.id} /></div>)}</div><ServiceForm locale={locale} slug={slug} /></div>
        <div id="staff" className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{locale === 'ar' ? 'الفريق' : 'Team'}</h2><p className="mt-1 text-sm text-[#758096]">{locale === 'ar' ? 'أضف أعضاء الفريق الذين يقدمون الخدمات.' : 'Add the people who provide your services.'}</p></div><span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#315efb]">{staffRows.length}</span></div><div className="mt-5 space-y-2">{staffRows.map((person) => <div key={person.id} className="rounded-2xl bg-[#f8faff] px-4 py-3"><p className="font-semibold">{person.name ?? (locale === 'ar' ? 'عضو فريق' : 'Team member')}</p><p className="mt-1 text-xs text-[#8993a5]">{person.email ?? person.phone ?? ''}</p></div>)}</div><StaffForm locale={locale} slug={slug} /></div>
        <div id="overrides" className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><h2 className="text-lg font-semibold">{locale === 'ar' ? 'استثناءات المواعيد' : 'Date overrides'}</h2><p className="mt-1 text-sm text-[#758096]">{locale === 'ar' ? 'أضف العطلات أو ساعات العمل الخاصة.' : 'Add holidays or custom hours.'}</p><div className="mt-5 space-y-2">{overrideRows.map((override) => <div key={override.id} className="flex items-center justify-between rounded-2xl bg-[#f8faff] px-4 py-3"><div><p className="font-semibold">{override.label ?? (override.kind === 'closed' ? (locale === 'ar' ? 'مغلق' : 'Closed') : (locale === 'ar' ? 'ساعات مخصصة' : 'Custom hours'))}</p><p className="mt-1 text-xs text-[#8993a5]">{override.startDate} → {override.endDate}{override.startTime ? ` · ${override.startTime}–${override.endTime}` : ''}</p></div></div>)}</div><DateOverrideForm locale={locale} slug={slug} /></div>
        <div id="hours" className="mt-6 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><h2 className="text-lg font-semibold">{locale === 'ar' ? 'ساعات العمل' : 'Working hours'}</h2><p className="mt-1 text-sm text-[#758096]">{locale === 'ar' ? 'حدد الأوقات العامة المتاحة للحجز.' : 'Set the general hours available for bookings.'}</p><WorkingHoursForm locale={locale} slug={slug} hours={hoursRows} /></div>
      </section>
    </div>
  </main>
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-[#e7eaf0] bg-white p-5 shadow-[0_18px_50px_rgba(30,45,80,.04)]"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#315efb]">{icon}</span><span className="text-2xl font-semibold">{value}</span></div><p className="mt-4 text-sm text-[#758096]">{label}</p></div>
}
