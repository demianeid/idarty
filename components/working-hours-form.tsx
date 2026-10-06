'use client'

import { useState, useTransition } from 'react'
import { saveWorkingHours } from '@/app/[locale]/tenants/[slug]/dashboard/hours-actions'
import type { Locale } from '@/lib/i18n'
import { useToast } from '@/components/toast'

const days = [{ ar: 'الأحد', en: 'Sunday' }, { ar: 'الإثنين', en: 'Monday' }, { ar: 'الثلاثاء', en: 'Tuesday' }, { ar: 'الأربعاء', en: 'Wednesday' }, { ar: 'الخميس', en: 'Thursday' }, { ar: 'الجمعة', en: 'Friday' }, { ar: 'السبت', en: 'Saturday' }]

export function WorkingHoursForm({ locale, slug, hours }: { locale: Locale; slug: string; hours: Array<{ weekday: number; startTime: string; endTime: string }> }) {
  const rtl = locale === 'ar'
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  return <div className="mt-5 space-y-3">{days.map((day, weekday) => { const current = hours.find((item) => item.weekday === weekday); return <form key={weekday} action={(formData) => { setMessage(''); startTransition(async () => { try { await saveWorkingHours(formData); const msg = rtl ? 'تم الحفظ' : 'Saved'; setMessage(msg); toast('success', msg) } catch { const msg = rtl ? 'تعذر الحفظ' : 'Could not save'; setMessage(msg); toast('error', msg) } }) }} className="grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center"><input type="hidden" name="slug" value={slug} /><input type="hidden" name="locale" value={locale} /><input type="hidden" name="weekday" value={weekday} /><span className="font-semibold">{day[locale]}</span><input name="startTime" type="time" defaultValue={current?.startTime ?? '09:00'} className="h-10 rounded-xl border border-[#e1e5ed] bg-paper px-3 text-sm disabled:opacity-50" /><input name="endTime" type="time" defaultValue={current?.endTime ?? '17:00'} className="h-10 rounded-xl border border-[#e1e5ed] bg-paper px-3 text-sm disabled:opacity-50" /><label className="flex items-center gap-2 text-sm text-ink-muted"><input name="closed" type="checkbox" defaultChecked={!current} value="true" />{rtl ? 'مغلق' : 'Closed'}<button disabled={pending} className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-semibold text-white">{rtl ? 'حفظ' : 'Save'}</button></label></form> })}<p aria-live="polite" className="text-sm text-brand-teal">{message}</p></div>
}
