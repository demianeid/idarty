'use client'

import { useTransition } from 'react'
import { archiveService } from '@/app/[locale]/tenants/[slug]/dashboard/actions'
import type { Locale } from '@/lib/i18n'

export function ServiceArchiveButton({ slug, locale, serviceId }: { slug: string; locale: Locale; serviceId: string }) {
  const [pending, startTransition] = useTransition()
  const rtl = locale === 'ar'

  return (
    <form action={(formData) => startTransition(() => { void archiveService(formData) })}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <button type="submit" disabled={pending} className="text-xs font-semibold text-[#b14b58] disabled:opacity-50">
        {pending ? (rtl ? 'جارٍ...' : 'Working...') : (rtl ? 'أرشفة' : 'Archive')}
      </button>
    </form>
  )
}
