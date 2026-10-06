'use client'

import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

export function LocaleSwitcher({ currentLocale }: { currentLocale: 'ar' | 'en' }) {
  const router = useRouter()
  const targetLocale = currentLocale === 'ar' ? 'en' : 'ar'
  const targetPath = targetLocale === 'ar' ? '/' : '/en'

  function handleSwitch() {
    // Set the cookie so the proxy respects the new choice
    document.cookie = `idarty_locale=${targetLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    router.push(targetPath)
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="flex h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#e1e5ed] px-3 text-sm font-semibold text-[#516078] transition hover:bg-[#f3f6ff]"
    >
      <Globe className="size-4 text-[#8a96a9]" />
      {currentLocale === 'ar' ? 'EN' : 'عربي'}
    </button>
  )
}
