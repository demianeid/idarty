import { describe, expect, it } from 'vitest'
import { isLocale, localeDirection } from './i18n'
import { buildLocalizedPath, buildTenantLocalePath } from './locale-path'
import { TenantWebsite } from '@/components/tenant-website'
import { LocaleSwitchLink } from '@/components/locale-switcher'
import { createDefaultWebsiteConfig } from './website-config'

// ---------------------------------------------------------------------------
// Document language resolution (#5) and locale switching (#6, #7).
//
// `buildLocalizedPath` is the pure routing rule behind the shared LocaleSwitcher
// used by both the Workspace header and the Website Builder.
// ---------------------------------------------------------------------------

describe('document lang and dir', () => {
  it('Arabic resolves to ar + rtl', () => {
    expect(isLocale('ar')).toBe(true)
    expect(localeDirection('ar')).toBe('rtl')
  })

  it('English resolves to en + ltr', () => {
    expect(isLocale('en')).toBe(true)
    expect(localeDirection('en')).toBe('ltr')
  })

  it('an unknown or missing locale is rejected so the layout can fall back', () => {
    for (const value of ['fr', 'AR', 'english', '', undefined, null]) {
      expect(isLocale(value as never)).toBe(false)
    }
  })
})

describe('locale switcher path building', () => {
  it('switches Arabic to English on a tenant workspace route', () => {
    expect(buildLocalizedPath('/ar/tenants/bebo-salon/dashboard', 'ar', 'en')).toBe(
      '/en/tenants/bebo-salon/dashboard'
    )
  })

  it('switches English to Arabic on a tenant workspace route', () => {
    expect(buildLocalizedPath('/en/tenants/bebo-salon/dashboard', 'en', 'ar')).toBe(
      '/ar/tenants/bebo-salon/dashboard'
    )
  })

  it('preserves the tenant slug', () => {
    const target = buildLocalizedPath('/ar/tenants/demo-gym/book', 'ar', 'en')!
    expect(target).toContain('/tenants/demo-gym/')
  })

  it('preserves the current page context (Website Builder tab)', () => {
    expect(buildLocalizedPath('/ar/tenants/bebo-salon/dashboard', 'ar', 'en', '?tab=website')).toBe(
      '/en/tenants/bebo-salon/dashboard?tab=website'
    )
  })

  it('preserves query parameters', () => {
    expect(buildLocalizedPath('/ar/tenants/x/preview', 'ar', 'en', '?a=1&b=2')).toBe(
      '/en/tenants/x/preview?a=1&b=2'
    )
  })

  it('handles the locale root itself', () => {
    expect(buildLocalizedPath('/ar', 'ar', 'en')).toBe('/en')
    expect(buildLocalizedPath('/en', 'en', 'ar')).toBe('/ar')
  })

  it('handles a deep route', () => {
    expect(buildLocalizedPath('/ar/tenants/x/book/confirmed', 'ar', 'en')).toBe(
      '/en/tenants/x/book/confirmed'
    )
  })

  it('never redirects to the homepage for a localized route', () => {
    const target = buildLocalizedPath('/ar/tenants/bebo-salon/dashboard', 'ar', 'en')!
    expect(target).not.toBe('/en')
    expect(target).not.toBe('/')
  })

  it('returns null when the path is not localized (bare /login, /signup)', () => {
    // These are top-level routes; the switcher falls back to the /[locale]
    // variant rather than producing an invalid path.
    expect(buildLocalizedPath('/login', 'ar', 'en')).toBeNull()
    expect(buildLocalizedPath('/signup', 'en', 'ar')).toBeNull()
    expect(buildLocalizedPath('/', 'ar', 'en')).toBeNull()
  })

  it('does not rewrite a path belonging to a different locale', () => {
    expect(buildLocalizedPath('/en/tenants/x', 'ar', 'en')).toBeNull()
  })

  it('produces valid routes for every real tenant route', () => {
    const routes = [
      '/ar/tenants/x',
      '/ar/tenants/x/book',
      '/ar/tenants/x/book/confirmed',
      '/ar/tenants/x/dashboard',
      '/ar/tenants/x/preview',
      '/ar/tenants/x/settings',
      '/ar/tenants/x/calendar',
      '/ar/dashboard',
      '/ar/onboarding',
      '/ar/admin',
      '/ar/verify-email',
    ]
    for (const route of routes) {
      const target = buildLocalizedPath(route, 'ar', 'en')!
      expect(target).toBeTruthy()
      expect(target.startsWith('/en/')).toBe(true)
      expect(target).not.toContain('/ar/')
    }
  })
})

// ---------------------------------------------------------------------------
// Public tenant website language toggle
//
// The customer-facing page must offer the switch in its own header, preserving
// the tenant slug, and must not leak any editor/dashboard control.
// ---------------------------------------------------------------------------

describe('public tenant website language switch', () => {
  describe('buildTenantLocalePath', () => {
    it('builds the English path from an Arabic page', () => {
      expect(buildTenantLocalePath('ar', 'en', 'bebo-salon')).toBe('/en/tenants/bebo-salon')
    })

    it('builds the Arabic path from an English page', () => {
      expect(buildTenantLocalePath('en', 'ar', 'bebo-salon')).toBe('/ar/tenants/bebo-salon')
    })

    it('preserves the tenant slug exactly', () => {
      for (const slug of ['bebo-salon', 'demo-gym', 'nile-wellness', 'a', 'tenant-with-many-dashes']) {
        expect(buildTenantLocalePath('ar', 'en', slug)).toContain(`/tenants/${slug}`)
      }
    })

    it('carries a query string when supplied', () => {
      expect(buildTenantLocalePath('ar', 'en', 'x', '?a=1')).toBe('/en/tenants/x?a=1')
    })

    it('never points at the homepage or the workspace', () => {
      const target = buildTenantLocalePath('ar', 'en', 'bebo-salon')
      expect(target).not.toBe('/en')
      expect(target).not.toContain('/dashboard')
    })
  })

  describe('LocaleSwitchLink', () => {
    it('offers EN on an Arabic page', () => {
      const el = LocaleSwitchLink({
        currentLocale: 'ar',
        href: '/en/tenants/bebo-salon',
      }) as React.ReactElement<{ href: string; hrefLang: string; children: unknown }>
      expect(el.props.href).toBe('/en/tenants/bebo-salon')
      expect(el.props.hrefLang).toBe('en')
    })

    it('offers AR on an English page', () => {
      const el = LocaleSwitchLink({
        currentLocale: 'en',
        href: '/ar/tenants/bebo-salon',
      }) as React.ReactElement<{ href: string; hrefLang: string }>
      expect(el.props.href).toBe('/ar/tenants/bebo-salon')
      expect(el.props.hrefLang).toBe('ar')
    })

    it('renders a real anchor (works without JS, no editor behaviour)', () => {
      const el = LocaleSwitchLink({ currentLocale: 'ar', href: '/en/tenants/x' }) as React.ReactElement<{
        type: string
      }>
      expect(el.type).toBe('a')
    })
  })

  describe('rendered public header', () => {
    const baseProps = {
      locale: 'ar' as const,
      slug: 'bebo-salon',
      tenant: { currency: 'EGP', email: null, phoneE164: null, theme: null },
      translation: { name: 'صالون', tagline: null, description: null, address: null },
      serviceRows: [],
      hoursRows: [],
      config: createDefaultWebsiteConfig(),
    }

    /** Collect hrefs from every element in the tree. */
    function hrefs(node: unknown, depth = 0, out: string[] = []): string[] {
      if (depth > 14 || node === null || typeof node !== 'object') return out
      if (Array.isArray(node)) {
        node.forEach((c) => hrefs(c, depth + 1, out))
        return out
      }
      const props = (node as { props?: { href?: unknown; children?: unknown } }).props
      if (props && typeof props.href === 'string') out.push(props.href)
      if (props) hrefs(props.children, depth + 1, out)
      return out
    }

    it('includes the language switch link in the header', () => {
      const el = TenantWebsite({
        ...baseProps,
        localeSwitch: LocaleSwitchLink({ currentLocale: 'ar', href: '/en/tenants/bebo-salon' }),
      })
      expect(hrefs(el)).toContain('/en/tenants/bebo-salon')
    })

    it('keeps the booking link alongside the switch', () => {
      const el = TenantWebsite({
        ...baseProps,
        localeSwitch: LocaleSwitchLink({ currentLocale: 'ar', href: '/en/tenants/bebo-salon' }),
      })
      const found = hrefs(el)
      expect(found).toContain('/ar/tenants/bebo-salon/book')
    })

    it('does not render a switch when none is supplied (e.g. preview)', () => {
      const el = TenantWebsite({ ...baseProps })
      expect(hrefs(el).some((h) => h.startsWith('/en/'))).toBe(false)
    })

    it('exposes no dashboard or editor links on the public page', () => {
      const el = TenantWebsite({
        ...baseProps,
        localeSwitch: LocaleSwitchLink({ currentLocale: 'ar', href: '/en/tenants/bebo-salon' }),
      })
      const found = hrefs(el)
      for (const href of found) {
        expect(href).not.toContain('/dashboard')
        expect(href).not.toContain('/preview')
        expect(href).not.toContain('/settings')
      }
    })

    it('renders the English page with ltr direction and an AR switch', () => {
      const el = TenantWebsite({
        ...baseProps,
        locale: 'en',
        localeSwitch: LocaleSwitchLink({ currentLocale: 'en', href: '/ar/tenants/bebo-salon' }),
      }) as React.ReactElement<{ dir: string }>
      expect(el.props.dir).toBe('ltr')
      expect(hrefs(el)).toContain('/ar/tenants/bebo-salon')
    })

    it('renders the Arabic page with rtl direction and an EN switch', () => {
      const el = TenantWebsite({
        ...baseProps,
        locale: 'ar',
        localeSwitch: LocaleSwitchLink({ currentLocale: 'ar', href: '/en/tenants/bebo-salon' }),
      }) as React.ReactElement<{ dir: string }>
      expect(el.props.dir).toBe('rtl')
      expect(hrefs(el)).toContain('/en/tenants/bebo-salon')
    })
  })
})
