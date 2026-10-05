"use client"

import { useActionState } from 'react'
import { updateTenantWebsite } from '@/app/[locale]/tenants/[slug]/settings/actions'

export function TenantSettingsForm({ slug, locale, initial }: { slug: string; locale: 'ar' | 'en'; initial: { name: string; tagline: string; description: string; address: string; phone: string; email: string } }) {
  const [state, action, pending] = useActionState(async (_: { ok: boolean; message?: string } | null, formData: FormData) => updateTenantWebsite(formData), null)
  const rtl = locale === 'ar'
  const fields = [
    ['name', rtl ? 'اسم النشاط' : 'Business name', initial.name],
    ['tagline', rtl ? 'الوصف المختصر' : 'Short tagline', initial.tagline],
    ['address', rtl ? 'العنوان' : 'Address', initial.address],
    ['phone', rtl ? 'الهاتف' : 'Phone', initial.phone],
    ['email', rtl ? 'البريد الإلكتروني' : 'Email', initial.email],
  ] as const
  return <form action={action} className="mt-6 grid gap-5 rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-[0_18px_50px_rgba(30,45,80,.04)] sm:p-8"><input type="hidden" name="slug" value={slug} /><input type="hidden" name="locale" value={locale} /><div className="grid gap-5 sm:grid-cols-2">{fields.map(([name, label, value]) => <label key={name} className="grid gap-2 text-sm font-semibold">{label}<input name={name} type={name === 'email' ? 'email' : 'text'} defaultValue={value} className="rounded-xl border border-[#dfe4ee] px-4 py-3 font-normal outline-none focus:border-[#315efb]" /></label>)}</div><label className="grid gap-2 text-sm font-semibold">{rtl ? 'نبذة عن النشاط' : 'About your business'}<textarea name="description" defaultValue={initial.description} rows={5} className="rounded-xl border border-[#dfe4ee] px-4 py-3 font-normal outline-none focus:border-[#315efb]" /></label><div className="flex items-center justify-between gap-4"><p className="text-sm text-[#24865b]">{state?.ok ? (rtl ? 'تم حفظ التغييرات.' : 'Changes saved.') : null}</p><button disabled={pending} className="rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? (rtl ? 'جارٍ الحفظ...' : 'Saving...') : (rtl ? 'حفظ التغييرات' : 'Save changes')}</button></div></form>
}
