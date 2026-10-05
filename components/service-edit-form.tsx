'use client'

import { useState, useTransition } from 'react'
import { updateService } from '@/app/[locale]/tenants/[slug]/dashboard/actions'
import type { Locale } from '@/lib/i18n'

export function ServiceEditForm({ locale, slug, service }: { locale: Locale; slug: string; service: { id: string; name: string; durationMin: number; priceAmount: string } }) {
  const rtl = locale === 'ar'
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  if (!editing) return <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-[#315efb]">{rtl ? 'تعديل' : 'Edit'}</button>
  return <form className="mt-3 grid gap-2 rounded-xl border border-[#dfe5f0] bg-white p-3 sm:grid-cols-4" action={(formData) => { startTransition(async () => { try { await updateService(formData); setMessage(rtl ? 'تم الحفظ' : 'Saved'); setEditing(false) } catch { setMessage(rtl ? 'تعذر الحفظ' : 'Could not save') } }) }}><input type="hidden" name="slug" value={slug} /><input type="hidden" name="locale" value={locale} /><input type="hidden" name="serviceId" value={service.id} /><input required name="name" defaultValue={service.name} className="rounded-lg border px-2 py-2 text-sm" /><input required name="durationMin" type="number" min="15" step="15" defaultValue={service.durationMin} className="rounded-lg border px-2 py-2 text-sm" /><input required name="priceAmount" type="number" min="0" step="0.01" defaultValue={service.priceAmount} className="rounded-lg border px-2 py-2 text-sm" /><button disabled={pending} className="rounded-lg bg-[#315efb] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? (rtl ? 'جارٍ الحفظ' : 'Saving') : (rtl ? 'حفظ' : 'Save')}</button>{message && <span className="text-xs text-[#24865b]">{message}</span>}</form>
}
