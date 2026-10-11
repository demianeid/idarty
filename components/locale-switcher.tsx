'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Globe } from 'lucide-react'
import { buildLocalizedPath, UNLOCALIZED_ROUTES } from '@/lib/locale-path'

// ---------------------------------------------------------------------------
// Locale switcher
//
// Swaps the locale segment of the CURRENT path and preserves everything else —
// nested route, tenant slug, and query string — so switching language keeps the
// user exactly where they were instead of dropping them on the home page.
//
//   /ar/tenants/bebo-salon/dashboard?tab=website
//     -> /en/tenants/bebo-salon/dashboard?tab=website
//
// `/login` and `/signup` are not localized (only their /[locale] variants are),
// so those fall back to the localized equivalent. The choice is also written to
// the `idarty_locale` cookie the proxy reads when resolving the bare `/` route.
//
// When `hasUnsavedChanges` is supplied and true, the switch is confirmed first so
// unsaved editor changes are never silently discarded.
//
// The path-building helpers live in `@/lib/locale-path` (NOT here) so they stay
// importable from Server Components — this module is a client module.
// ---------------------------------------------------------------------------

/**
 * Compact, link-based locale toggle for PUBLIC pages.
 *
 * Unlike `LocaleSwitcher` (an interactive control that reads `usePathname` and
 * guards unsaved changes), this renders a real `<a href>` so the public tenant
 * website can stay a Server Component, the toggle is crawlable, and it works
 * without JavaScript. It carries no editor or dashboard behaviour.
 */
export function LocaleSwitchLink({
  currentLocale,
  href,
  className,
}: {
  currentLocale: 'ar' | 'en'
  href: string
  className?: string
}) {
  const isArabic = currentLocale === 'ar'
  return (
    <a
      href={href}
      hrefLang={isArabic ? 'en' : 'ar'}
      aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      className={
        className ??
        'flex items-center gap-1 rounded-lg border border-[#e1e5ed] px-2.5 py-1.5 text-xs font-semibold text-[#516078] transition hover:border-brand-teal hover:text-brand-teal'
      }
    >
      <Globe className="size-3.5" aria-hidden="true" />
      {isArabic ? 'EN' : 'AR'}
    </a>
  )
}

export function LocaleSwitcher({
  currentLocale,
  hasUnsavedChanges = false,
  className,
}: {
  currentLocale: 'ar' | 'en'
  hasUnsavedChanges?: boolean
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const targetLocale = currentLocale === 'ar' ? 'en' : 'ar'
  const search = searchParams.toString() ? `?${searchParams.toString()}` : ''

  function handleSwitch() {
    if (hasUnsavedChanges) {
      const message =
        currentLocale === 'ar'
          ? 'لديك تغييرات غير محفوظة. سيتم فقدانها إذا غيّرت اللغة. هل تريد المتابعة؟'
          : 'You have unsaved changes that will be lost if you switch language. Continue?'
      if (!window.confirm(message)) return
    }

    // Remember the choice so the proxy can resolve the bare `/` route later.
    document.cookie = `idarty_locale=${targetLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`

    const localized = buildLocalizedPath(pathname, currentLocale, targetLocale, search)
    if (localized) {
      router.push(localized)
      return
    }

    // Non-localized route (the bare /login or /signup page): send the user to the
    // equivalent page in the other language rather than the homepage.
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 1 && UNLOCALIZED_ROUTES.has(segments[0])) {
      router.push(`/${targetLocale}/${segments[0]}${search}`)
      return
    }

    // Final safe fallback for anything else: the localized home page.
    router.push(`/${targetLocale}`)
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={currentLocale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className={
        className ??
        'flex h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#e1e5ed] px-3 text-sm font-semibold text-[#516078] transition hover:bg-[#f3f6ff] outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2'
      }
    >
      <Globe className="size-4 text-[#8a96a9]" aria-hidden="true" />
      {currentLocale === 'ar' ? 'EN' : 'عربي'}
    </button>
  )
}
