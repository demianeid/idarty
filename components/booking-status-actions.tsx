'use client'

import { useState, useTransition } from 'react'
import { cancelBooking, markNoShow } from '@/app/[locale]/tenants/[slug]/dashboard/booking-actions'
import { rescheduleBooking } from '@/app/[locale]/tenants/[slug]/dashboard/reschedule-actions'
import { useToast } from '@/components/toast'

export function BookingStatusActions({ slug, bookingId, locale }: { slug: string; bookingId: string; locale: 'ar' | 'en' }) {
  const [pending, startTransition] = useTransition()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmNoShow, setConfirmNoShow] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [newTime, setNewTime] = useState('')
  const { toast } = useToast()
  const rtl = locale === 'ar'

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {confirmCancel ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-muted px-1">{rtl ? 'متأكد؟' : 'Sure?'}</span>
          <button type="button" disabled={pending} onClick={() => startTransition(async () => {
            const res = await cancelBooking({ slug, bookingId })
            if (res.ok) toast('success', rtl ? 'تم الإلغاء' : 'Cancelled')
            else toast('error', res.message || (rtl ? 'حدث خطأ' : 'Error'))
            setConfirmCancel(false)
          })} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 hover:bg-red-700 transition">{rtl ? 'نعم، إلغاء' : 'Yes, cancel'}</button>
          <button type="button" disabled={pending} onClick={() => setConfirmCancel(false)} className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-ink-muted hover:bg-surface transition">{rtl ? 'تراجع' : 'No'}</button>
        </div>
      ) : (
        <button type="button" disabled={pending || confirmNoShow} onClick={() => setConfirmCancel(true)} className="rounded-lg border border-[#f0c8c8] px-3 py-1 text-xs font-semibold text-[#b42318] disabled:opacity-50 hover:bg-[#fdf2f2] transition">{pending ? '...' : rtl ? 'إلغاء' : 'Cancel'}</button>
      )}

      {confirmNoShow ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-muted px-1">{rtl ? 'متأكد؟' : 'Sure?'}</span>
          <button type="button" disabled={pending} onClick={() => startTransition(async () => {
            const res = await markNoShow({ slug, bookingId })
            if (res.ok) toast('success', rtl ? 'تم التسجيل' : 'Saved')
            else toast('error', res.message || (rtl ? 'حدث خطأ' : 'Error'))
            setConfirmNoShow(false)
          })} className="rounded-lg bg-ink px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 hover:bg-ink-muted transition">{rtl ? 'نعم' : 'Yes'}</button>
          <button type="button" disabled={pending} onClick={() => setConfirmNoShow(false)} className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-ink-muted hover:bg-surface transition">{rtl ? 'تراجع' : 'No'}</button>
        </div>
      ) : (
        <button type="button" disabled={pending || confirmCancel} onClick={() => setConfirmNoShow(true)} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-ink-muted disabled:opacity-50 hover:bg-[#f1f5f9] transition">{rtl ? 'لم يحضر' : 'No-show'}</button>
      )}

      {!confirmCancel && !confirmNoShow && !isRescheduling && (
        <button type="button" disabled={pending} onClick={() => setIsRescheduling(true)} className="rounded-lg border border-[#d5ddf8] px-3 py-1 text-xs font-semibold text-brand-teal disabled:opacity-50 hover:bg-[#f0f4ff] transition">{rtl ? 'تغيير الموعد' : 'Reschedule'}</button>
      )}

      {isRescheduling && (
        <form onSubmit={(e) => {
          e.preventDefault()
          if (!newTime) return
          startTransition(async () => {
            const res = await rescheduleBooking({ slug, bookingId, startsAt: new Date(newTime).toISOString() })
            if (res.ok) {
              toast('success', rtl ? 'تم تغيير الموعد' : 'Rescheduled')
              setIsRescheduling(false)
            } else {
              toast('error', res.message || (rtl ? 'خطأ' : 'Error'))
            }
          })
        }} className="flex items-center gap-1">
          <input type="datetime-local" required value={newTime} onChange={(e) => setNewTime(e.target.value)} disabled={pending} className="h-8 rounded-lg border border-border px-2 text-xs outline-none focus:border-brand-teal" />
          <button type="submit" disabled={pending || !newTime} className="rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#1a856a] transition">{rtl ? 'حفظ' : 'Save'}</button>
          <button type="button" disabled={pending} onClick={() => setIsRescheduling(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface transition">{rtl ? 'إلغاء' : 'Cancel'}</button>
        </form>
      )}
    </div>
  )
}
