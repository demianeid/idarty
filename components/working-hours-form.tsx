'use client'

import { useState, useTransition } from 'react'
import { saveWorkingHours } from '@/app/[locale]/tenants/[slug]/dashboard/hours-actions'
import type { Locale } from '@/lib/i18n'
import { useToast } from '@/components/toast'

const days = [{ ar: 'الأحد', en: 'Sunday' }, { ar: 'الإثنين', en: 'Monday' }, { ar: 'الثلاثاء', en: 'Tuesday' }, { ar: 'الأربعاء', en: 'Wednesday' }, { ar: 'الخميس', en: 'Thursday' }, { ar: 'الجمعة', en: 'Friday' }, { ar: 'السبت', en: 'Saturday' }]

function DayForm({ locale, slug, weekday, current }: { locale: Locale; slug: string; weekday: number; current: { startTime: string; endTime: string } | undefined }) {
  const rtl = locale === 'ar'
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [isClosed, setIsClosed] = useState(!current)

  return (
    <form action={(formData) => {
      startTransition(async () => {
        try {
          await saveWorkingHours(formData)
          toast('success', rtl ? 'تم حفظ ساعات العمل بنجاح' : 'Working hours saved successfully')
        } catch {
          toast('error', rtl ? 'تأكد من اختيار الأوقات بشكل صحيح' : 'Make sure times are correctly selected')
        }
      })
    }} className="grid gap-4 rounded-2xl bg-surface p-4 sm:grid-cols-[100px_1fr_1fr_auto_auto] sm:items-center border border-[#f1f3f7]">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="weekday" value={weekday} />

      <span className="font-semibold text-sm">{days[weekday][locale]}</span>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-muted min-w-[20px]">{rtl ? 'من' : 'From'}</span>
        <input name="startTime" type="time" disabled={isClosed || pending} defaultValue={current?.startTime ?? '09:00'} className="h-11 w-full rounded-xl border border-[#e1e5ed] bg-paper px-3 text-sm disabled:opacity-40 disabled:bg-[#f8f9fb] outline-none focus:border-brand-teal transition" />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-muted min-w-[20px]">{rtl ? 'إلى' : 'To'}</span>
        <input name="endTime" type="time" disabled={isClosed || pending} defaultValue={current?.endTime ?? '17:00'} className="h-11 w-full rounded-xl border border-[#e1e5ed] bg-paper px-3 text-sm disabled:opacity-40 disabled:bg-[#f8f9fb] outline-none focus:border-brand-teal transition" />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-muted cursor-pointer select-none">
        <input name="closed" type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} value="true" className="h-4 w-4 rounded border-[#e1e5ed] text-brand-teal focus:ring-brand-teal cursor-pointer" />
        {rtl ? 'مغلق' : 'Closed'}
      </label>

      <button disabled={pending} className="rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a856a] disabled:opacity-60 flex items-center justify-center min-w-[70px]">
        {pending ? '...' : (rtl ? 'حفظ' : 'Save')}
      </button>
    </form>
  )
}

export function WorkingHoursForm({ locale, slug, hours }: { locale: Locale; slug: string; hours: Array<{ weekday: number; startTime: string; endTime: string }> }) {
  return (
    <div className="mt-5 space-y-3">
      {days.map((_, weekday) => {
        const current = hours.find((item) => item.weekday === weekday)
        return <DayForm key={weekday} locale={locale} slug={slug} weekday={weekday} current={current} />
      })}
    </div>
  )
}
