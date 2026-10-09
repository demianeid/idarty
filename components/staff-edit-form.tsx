'use client'

import { useState, useTransition } from 'react'
import { updateStaff } from '@/app/[locale]/tenants/[slug]/dashboard/staff-actions'
import type { Locale } from '@/lib/i18n'
import { useToast } from '@/components/toast'

type Staff = { id: string; name: string; email: string; phone: string }

export function StaffEditForm({ locale, slug, staff }: { locale: Locale; slug: string; staff: Staff }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const rtl = locale === 'ar'
  return <>
    <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-teal">{rtl ? 'تعديل' : 'Edit'}</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/30 p-4"><form action={(formData) => startTransition(async () => { try { await updateStaff(formData); toast('success', rtl ? 'تم حفظ التغييرات' : 'Changes saved'); setOpen(false) } catch { toast('error', rtl ? 'تعذر الحفظ' : 'Could not save') } })} className="grid w-full max-w-md gap-3 rounded-3xl bg-paper p-6 shadow-xl"><input type="hidden" name="locale" value={locale} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="staffId" value={staff.id} /><label className="grid gap-1 text-sm font-semibold">{rtl ? 'الاسم' : 'Name'}<input required name="name" defaultValue={staff.name} className="rounded-xl border px-3 py-2 font-normal" /></label><label className="grid gap-1 text-sm font-semibold">{rtl ? 'البريد الإلكتروني' : 'Email'}<input name="email" type="email" defaultValue={staff.email} className="rounded-xl border px-3 py-2 font-normal" /></label><label className="grid gap-1 text-sm font-semibold">{rtl ? 'الهاتف' : 'Phone'}<input name="phone" defaultValue={staff.phone} placeholder={rtl ? 'مثال: 01001234567' : 'e.g. 01001234567'} title={rtl ? 'يمكنك إدخال الرقم المحلي أو بالصيغة الدولية' : 'Local format or international format allowed'} className="rounded-xl border px-3 py-2 font-normal" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm">{rtl ? 'إلغاء' : 'Cancel'}</button><button disabled={pending} className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white">{rtl ? 'حفظ' : 'Save'}</button></div></form></div>}
  </>
}
