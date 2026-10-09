'use client'

import { useRef, useState, useTransition } from 'react'
import { createStaff } from '@/app/[locale]/tenants/[slug]/dashboard/staff-actions'
import type { Locale } from '@/lib/i18n'
import { useToast } from '@/components/toast'

export function StaffForm({ locale, slug }: { locale: Locale; slug: string }) {
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const rtl = locale === 'ar'
  return <form ref={formRef} className="mt-5 grid gap-3 sm:grid-cols-3" action={(formData) => startTransition(async () => { try { await createStaff(formData); const msg = rtl ? 'تمت إضافة الموظف.' : 'Staff member added.'; setMessage(msg); toast('success', msg); formRef.current?.reset() } catch { const msg = rtl ? 'تعذر إضافة الموظف.' : 'Could not add staff member.'; setMessage(msg); toast('error', msg) } })}>
    <input type="hidden" name="locale" value={locale} /><input type="hidden" name="slug" value={slug} />
    <input required name="name" placeholder={rtl ? 'اسم الموظف' : 'Staff name'} className="h-11 rounded-xl border border-[#e1e5ed] px-3 text-sm" />
    <input name="email" type="email" placeholder={rtl ? 'البريد الإلكتروني' : 'Email'} className="h-11 rounded-xl border border-[#e1e5ed] px-3 text-sm" />
    <input name="phone" placeholder={rtl ? 'الهاتف (مثال: 01001234567)' : 'Phone (e.g. 01001234567)'} className="h-11 rounded-xl border border-[#e1e5ed] px-3 text-sm" />
    <button disabled={pending} className="h-11 rounded-xl bg-brand-teal px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? '...' : rtl ? 'إضافة موظف' : 'Add staff'}</button>
    {message && <p className="text-sm text-[#24865b] sm:col-span-3">{message}</p>}
  </form>
}
