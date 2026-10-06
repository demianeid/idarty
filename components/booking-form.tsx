'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition, useCallback } from 'react'
import { createPublicBooking } from '@/app/[locale]/tenants/[slug]/book/actions'
import type { Locale } from '@/lib/i18n'
import { useToast } from '@/components/toast'

type Service = { id: string; name: string | null; durationMin: number; priceAmount: string }

export function BookingForm({ locale, slug, slots, services, defaultServiceId }: { locale: Locale; slug: string; slots: string[]; services: Service[]; defaultServiceId?: string }) {
  const rtl = locale === 'ar'
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const formatSlot = (slot: string) => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(slot))
  
  const handleServiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams)
    params.set('service', e.target.value)
    router.replace(`${pathname}?${params.toString()}`)
  }, [pathname, searchParams, router])

  return <form dir={rtl ? 'rtl' : 'ltr'} className="space-y-4" onSubmit={(event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage('')
    setSuggestions([])
    startTransition(async () => {
      const result = await createPublicBooking({ slug, locale, serviceId: String(form.get('serviceId')), fullName: String(form.get('fullName')), phone: String(form.get('phone')), email: String(form.get('email') || ''), startsAt: new Date(String(form.get('startsAt'))).toISOString() })
      if (result.ok) {
        toast('success', rtl ? 'تم تأكيد الحجز بنجاح' : 'Booking confirmed successfully')
        router.push(`/${locale}/tenants/${slug}/book/confirmed?booking=${result.bookingId}`)
      } else {
        setMessage(result.message)
        toast('error', result.message)
        if ('suggestions' in result && result.suggestions) setSuggestions(result.suggestions)
      }
    })
  }}>
    <label className="block text-sm font-semibold">{rtl ? 'الخدمة' : 'Service'}<select required name="serviceId" defaultValue={defaultServiceId} onChange={handleServiceChange} className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-brand-teal"><option value="" disabled>{rtl ? 'اختر خدمة' : 'Choose a service'}</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.durationMin} {rtl ? 'دقيقة' : 'min'})</option>)}</select></label>
    <label className="block text-sm font-semibold">{rtl ? 'الاسم الكامل' : 'Full name'}<input required name="fullName" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-brand-teal" /></label>
    <label className="block text-sm font-semibold">{rtl ? 'رقم الهاتف' : 'Phone'}<input required name="phone" type="tel" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-brand-teal" /></label>
    <label className="block text-sm font-semibold">{rtl ? 'البريد الإلكتروني' : 'Email'}<input name="email" type="email" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-brand-teal" /></label>
    <label className="block text-sm font-semibold">{rtl ? 'التاريخ والوقت' : 'Date and time'}<select required name="startsAt" defaultValue="" className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 outline-none focus:border-brand-teal"><option value="" disabled>{slots.length ? (rtl ? 'اختر الوقت المتاح' : 'Choose an available time') : (rtl ? 'لا توجد أوقات متاحة حالياً' : 'No times available currently')}</option>{slots.map((slot) => <option key={slot} value={slot}>{formatSlot(slot)}</option>)}</select></label>
    <button disabled={pending || !slots.length} className="h-12 w-full rounded-xl bg-brand-teal font-semibold text-white disabled:opacity-60">{pending ? (rtl ? 'جارٍ الحجز...' : 'Booking...') : (rtl ? 'تأكيد الحجز' : 'Confirm booking')}</button>
    {message && <p role="status" className="rounded-xl bg-[#fef2f2] border border-[#fecaca] p-3 text-sm text-[#b91c1c]">{message}</p>}
    {suggestions.length > 0 && <div className="rounded-xl bg-paper p-3 border border-[#e1e5ed]">
      <p className="text-sm font-semibold mb-2">{rtl ? 'أوقات بديلة مقترحة:' : 'Suggested alternative times:'}</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => {
            const select = document.querySelector('select[name="startsAt"]') as HTMLSelectElement;
            if (select) {
              const optionExists = Array.from(select.options).some(opt => opt.value === s)
              if (!optionExists) {
                const newOption = new window.Option(formatSlot(s), s)
                select.add(newOption)
              }
              select.value = s
            }
            setSuggestions([])
            setMessage('')
          }} className="rounded-lg bg-[#f0faf9] px-3 py-1.5 text-xs font-semibold text-brand-teal transition hover:bg-[#b2e4df]">{formatSlot(s)}</button>
        ))}
      </div>
    </div>}
  </form>
}
