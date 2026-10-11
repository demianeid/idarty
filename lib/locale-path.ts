// ---------------------------------------------------------------------------
// Locale path helpers
//
// Pure, framework-free functions — deliberately NOT in a `'use client'` module so
// they can be imported and called from Server Components as well as client ones.
// ---------------------------------------------------------------------------

/** Routes that exist at the top level and are not localized (no /[locale] prefix). */
export const UNLOCALIZED_ROUTES = new Set(['login', 'signup'])

/**
 * Rewrite the locale segment of a localized path, preserving the rest + query.
 * Returns null when the path does not start with `currentLocale` (so the caller
 * can fall back safely instead of producing an invalid route).
 *
 *   buildLocalizedPath('/ar/tenants/x/dashboard', 'ar', 'en', '?tab=website')
 *     -> '/en/tenants/x/dashboard?tab=website'
 */
export function buildLocalizedPath(
  pathname: string,
  currentLocale: string,
  nextLocale: string,
  search = ''
): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== currentLocale) return null
  const rest = segments.slice(1)
  return `/${[nextLocale, ...rest].join('/')}${search}`
}

/**
 * Build the equivalent path for a tenant's PUBLIC page in the other locale.
 *
 * Preserves the tenant slug (and any additional public segments/query), so a
 * visitor switching language stays on the same public page:
 *
 *   buildTenantLocalePath('ar', 'en', 'bebo-salon')         -> '/en/tenants/bebo-salon'
 *   buildTenantLocalePath('ar', 'en', 'bebo-salon', '?a=1') -> '/en/tenants/bebo-salon?a=1'
 */
export function buildTenantLocalePath(
  currentLocale: string,
  nextLocale: string,
  slug: string,
  search = ''
): string {
  return `/${nextLocale}/tenants/${slug}${search}`
}
