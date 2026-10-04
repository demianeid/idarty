import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { BookingForm } from '@/components/booking-form'
import { getAvailableSlots } from './actions'
import type { Locale } from '@/lib/i18n'

export default async function BookingPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const rtl = locale === 'ar'
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    return date.toISOString().slice(0, 10)
  })
  const slots = (await Promise.all(dates.map((date) => getAvailableSlots(slug, date)))).flat()
  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#fbfcfe] px-6 py-10 text-[#172033] sm:py-16">
    <div className="mx-auto max-w-xl">
      <Link href={`/${locale}/tenants/${slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f7b90]"><ArrowLeft className="h-4 w-4" />{rtl ? 'العودة للمساحة' : 'Back to workspace'}</Link>
      <section className="mt-8 rounded-[2rem] border border-[#e6eaf1] bg-white p-6 shadow-[0_20px_60px_rgba(30,45,80,.07)] sm:p-9">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]"><CalendarDays className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{rtl ? 'حجز موعد' : 'Book an appointment'}</p><p className="mt-1 text-xs text-[#929bad]">{rtl ? 'أدخل بياناتك والوقت المفضل' : 'Enter your details and preferred time'}</p></div></div>
        <div className="mt-8"><BookingForm locale={locale} slug={slug} slots={slots} /></div>
      </section>
    </div>
  </main>
}
