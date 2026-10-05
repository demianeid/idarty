'use client'

import { useActionState, useState } from 'react'
import { createTenant } from '@/app/[locale]/onboarding/actions'
import { businessTypes, businessTypeLabels, defaultWorkspacePlaceholder, type BusinessType } from '@/lib/business-types'
import { publicTenantUrl } from '@/lib/routes'

export function OnboardingForm({ locale }: { locale: 'ar' | 'en' }) {
  const rtl = locale === 'ar'
  const [state, action, pending] = useActionState(createTenant, null)
  const [businessType, setBusinessType] = useState<BusinessType>('salon')

  return <form action={action} className="mt-9 space-y-5">
    <input type="hidden" name="locale" value={locale} />
    <label className="block text-sm font-semibold">{rtl ? 'نوع النشاط' : 'Business type'}<select name="businessType" value={businessType} onChange={(event) => setBusinessType(event.target.value as BusinessType)} className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] bg-white px-4 text-sm outline-none transition focus:border-[#315efb] focus:ring-4 focus:ring-[#315efb]/10">{businessTypes.map((type) => <option key={type} value={type}>{businessTypeLabels[type][locale]}</option>)}</select></label>
    <label className="block text-sm font-semibold">{rtl ? 'اسم مساحة العمل' : 'Workspace name'}<input name="name" required minLength={2} maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 text-sm outline-none transition focus:border-[#315efb] focus:ring-4 focus:ring-[#315efb]/10" placeholder={defaultWorkspacePlaceholder(businessType, locale)} /></label>
    <label className="block text-sm font-semibold">{rtl ? 'الرابط المختصر' : 'Workspace URL'}<div className="mt-2 flex items-center rounded-xl border border-[#e1e5ed] focus-within:border-[#315efb] focus-within:ring-4 focus-within:ring-[#315efb]/10"><span className="max-w-[55%] truncate px-4 text-sm text-[#9aa3b2]">{publicTenantUrl(locale, '')}</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={48} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm outline-none" placeholder="nile-wellness" /></div></label>
    {state && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.message[locale]}</p>}
    <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,94,251,.2)] disabled:cursor-not-allowed disabled:opacity-60">{pending ? (rtl ? 'جارٍ الإنشاء...' : 'Creating...') : (rtl ? 'متابعة' : 'Continue')}</button>
  </form>
}
