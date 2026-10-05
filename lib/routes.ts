import type { Locale } from './i18n'

export function publicTenantUrl(locale: Locale, slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  return `${base ?? ''}/${locale}/tenants/${encodeURIComponent(slug)}`
}

export function localizedPath(locale: Locale, path: string) {
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`
}
