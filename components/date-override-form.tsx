"use client"

import { useTransition } from 'react'
import { createDateOverride } from '@/app/[locale]/tenants/[slug]/dashboard/override-actions'
import type { Locale } from '@/lib/i18n'

export function DateOverrideForm({ locale, slug }: { locale: Locale; slug: string }) {
  const [pending, startTransition] = useTransition()
  const rtl = locale === 'ar'
  return <form action={(formData) => startTransition(async () => { await createDateOverride(formData); window.location.reload() })} className="mt-5 grid gap-3 sm:grid-cols-2">
    <input type="hidden" name="locale" value={locale} /><input type="hidden" name="slug" value={slug} />
    <label className="text-sm font-semibold">{rtl ? 'من تاريخ' : 'Start date'}<input required name="startDate" type="date" className="mt-2 h-11 w-full rounded-xl border border-[#e1e5ed] px-3" /></label>
    <label className="text-sm font-semibold">{rtl ? 'إلى تاريخ' : 'End date'}<input required name="endDate" type="date" className="mt-2 h-11 w-full rounded-xl border border-[#e1e5ed] px-3" /></label>
    <label className="text-sm font-semibold">{rtl ? 'نوع الاستثناء' : 'Override type'}<select name="kind" className="mt-2 h-11 w-full rounded-xl border border-[#e1e5ed] px-3"><option value="closed">{rtl ? 'مغلق' : 'Closed'}</option><option value="custom_hours">{rtl ? 'ساعات مخصصة' : 'Custom hours'}</option></select></label>
    <label className="text-sm font-semibold">{rtl ? 'الوصف' : 'Label'}<input name="label" placeholder={rtl ? 'عطلة رسمية' : 'Public holiday'} className="mt-2 h-11 w-full rounded-xl border border-[#e1e5ed] px-3" /></label>
    <label className="text-sm font-semibold">{rtl ? 'وقت البداية' : 'Start time'}<input name="startTime" type="time" className="mt-2 h-11 w-full rounded-xl border border-[#e1e5ed] px-3" /></label>
    <label className="text-sm font-semibold">{rtl ? 'وقت النهاية' : 'End time'}<input name="endTime" type="time" className="mt-2 h-11 w-full rounded-xl border border-[#e1e5ed] px-3" /></label>
    <button disabled={pending} className="h-11 rounded-xl bg-[#315efb] px-4 text-sm font-semibold text-white sm:col-span-2">{pending ? '...' : rtl ? 'إضافة استثناء' : 'Add override'}</button>
  </form>
}
