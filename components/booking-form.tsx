'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createPublicBooking } from '@/app/[locale]/tenants/[slug]/book/actions'
import type { Locale } from '@/lib/i18n'

export function BookingForm({ locale, slug, slots }: { locale: Locale; slug: string; slots: string[] }) {
  const rtl = locale === 'ar'
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const formatSlot = (slot: string) => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(slot))
  return <form dir={rtl ? 'rtl' : 'ltr'} className="space-y-4" onSubmit={(event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage('')
    startTransition(async () => {
      const result = await createPublicBooking({ slug, locale, fullName: String(form.get('fullName')), phone: String(form.get('phone')), email: String(form.get('email') || ''), startsAt: new Date(String(form.get('startsAt'))).toISOString() })
      if (result.ok) router.push(`/${locale}/tenants/${slug}/book/confirmed?booking=${result.bookingId}`)
      else setMessage(result.message)
    })
  }}>
    <label className="block text-sm font-semibold">{rtl ? 'الاسم الكامل' : 'Full name'}<input required name="fullName" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-[#315efb]" /></label>
    <label className="block text-sm font-semibold">{rtl ? 'رقم الهاتف' : 'Phone'}<input required name="phone" type="tel" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-[#315efb]" /></label>
    <label className="block text-sm font-semibold">{rtl ? 'البريد الإلكتروني' : 'Email'}<input name="email" type="email" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-[#315efb]" /></label>
    <label className="block text-sm font-semibold">{rtl ? 'التاريخ والوقت' : 'Date and time'}<select required name="startsAt" defaultValue="" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-[#315efb]"><option value="" disabled>{slots.length ? (rtl ? 'اختر الوقت المتاح' : 'Choose an available time') : (rtl ? 'لا توجد أوقات متاحة اليوم' : 'No times available today')}</option>{slots.map((slot) => <option key={slot} value={slot}>{formatSlot(slot)}</option>)}</select></label>
    <button disabled={pending} className="h-12 w-full rounded-xl bg-[#315efb] font-semibold text-white disabled:opacity-60">{pending ? (rtl ? 'جارٍ الحجز...' : 'Booking...') : (rtl ? 'تأكيد الحجز' : 'Confirm booking')}</button>
    {message && <p role="status" className="rounded-xl bg-[#f1f5ff] p-3 text-sm text-[#315efb]">{message}</p>}
  </form>
}
