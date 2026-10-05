'use client'

import { useTransition } from 'react'
import { archiveStaff } from '@/app/[locale]/tenants/[slug]/dashboard/staff-actions'
import type { Locale } from '@/lib/i18n'

export function StaffArchiveButton({ locale, slug, staffId }: { locale: Locale; slug: string; staffId: string }) {
  const [pending, startTransition] = useTransition()
  const rtl = locale === 'ar'
  return <form action={(formData) => startTransition(async () => { await archiveStaff(formData) })}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="staffId" value={staffId} /><button disabled={pending} className="text-xs font-semibold text-[#c44b4b]">{rtl ? 'أرشفة' : 'Archive'}</button></form>
}
