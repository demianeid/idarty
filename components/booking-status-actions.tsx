'use client'

import { useTransition } from 'react'
import { cancelBooking } from '@/app/[locale]/tenants/[slug]/dashboard/booking-actions'
import { rescheduleBooking } from '@/app/[locale]/tenants/[slug]/dashboard/reschedule-actions'

export function BookingStatusActions({ slug, bookingId, locale }: { slug: string; bookingId: string; locale: 'ar' | 'en' }) {
  const [pending, startTransition] = useTransition()
  return <div className="flex items-center gap-2"><button type="button" disabled={pending} onClick={() => { if (!window.confirm(locale === 'ar' ? 'هل تريد إلغاء الموعد؟' : 'Cancel this appointment?')) return; startTransition(async () => { await cancelBooking({ slug, bookingId }); window.location.reload() }) }} className="rounded-lg border border-[#f0c8c8] px-3 py-1 text-xs font-semibold text-[#b42318] disabled:opacity-50">{pending ? '...' : locale === 'ar' ? 'إلغاء' : 'Cancel'}</button><button type="button" disabled={pending} onClick={() => { const value = window.prompt(locale === 'ar' ? 'أدخل الموعد الجديد بصيغة YYYY-MM-DDTHH:mm' : 'Enter the new time as YYYY-MM-DDTHH:mm'); if (!value) return; startTransition(async () => { await rescheduleBooking({ slug, bookingId, startsAt: new Date(value).toISOString() }); window.location.reload() }) }} className="rounded-lg border border-[#d5ddf8] px-3 py-1 text-xs font-semibold text-[#315efb] disabled:opacity-50">{locale === 'ar' ? 'تغيير الموعد' : 'Reschedule'}</button></div>
}
