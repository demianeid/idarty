import { describe, expect, it } from 'vitest'
import { TenantWebsite } from '@/components/tenant-website'
import {
  createDefaultWebsiteConfig,
  parseWebsiteConfig,
  safeParseWebsiteConfig,
  resolveSiteBackground,
  DEFAULT_SITE_BACKGROUND,
  type WebsiteConfig,
} from './website-config'
import { THEME_PRESETS, applyPreset } from './theme-presets'

// ---------------------------------------------------------------------------
// Website background color pipeline
//
// The Website Builder's "secondary color" IS the website background. This traces
// the whole pipeline against the REAL shared renderer:
//
//   editor background input -> config.theme.backgroundColor -> persisted draft
//     -> preview renderer (draft) -> publish -> live renderer (published)
//
// TenantWebsite is a synchronous function component, so calling it returns an
// element tree we can inspect for the resolved CSS variables.
// ---------------------------------------------------------------------------

const baseProps = {
  locale: 'ar' as const,
  slug: 'demo-salon',
  tenant: { currency: 'EGP', email: null, phoneE164: null, theme: null },
  translation: { name: 'صالون', tagline: null, description: null, address: null },
  serviceRows: [],
  hoursRows: [],
}

function rootStyle(config: WebsiteConfig | null, tenantTheme: Record<string, string> | null = null) {
  const el = TenantWebsite({
    ...baseProps,
    tenant: { ...baseProps.tenant, theme: tenantTheme },
    config,
  }) as React.ReactElement<{ style: Record<string, unknown> }>
  return el.props.style
}

/** Collect every inline style object in the element tree. */
function allStyles(config: WebsiteConfig | null) {
  const el = TenantWebsite({ ...baseProps, config })
  const styles: Record<string, unknown>[] = []
  const walk = (node: unknown, depth = 0) => {
    if (depth > 14 || node === null || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach((c) => walk(c, depth + 1))
    const props = (node as { props?: { style?: unknown; children?: unknown } }).props
    if (props && props.style && typeof props.style === 'object') {
      styles.push(props.style as Record<string, unknown>)
    }
    if (props) walk(props.children, depth + 1)
  }
  walk(el)
  return styles
}

/** Simulates the editor's updateTheme('backgroundColor', value) handler. */
function updateBackground(config: WebsiteConfig, value: string): WebsiteConfig {
  return { ...config, theme: { ...config.theme, backgroundColor: value } }
}

describe('website background color', () => {
  // -------------------------------------------------------------------------
  // resolveSiteBackground: the mapping rule
  // -------------------------------------------------------------------------
  describe('resolveSiteBackground', () => {
    it('prefers backgroundColor', () => {
      expect(resolveSiteBackground({ backgroundColor: '#111111' })).toBe('#111111')
    })

    it('falls back to the legacy accentColor for older configurations', () => {
      expect(resolveSiteBackground({ accentColor: '#222222' })).toBe('#222222')
    })

    it('prefers backgroundColor when both are present', () => {
      expect(resolveSiteBackground({ backgroundColor: '#111111', accentColor: '#222222' })).toBe('#111111')
    })

    it('falls back to the default when neither is set', () => {
      expect(resolveSiteBackground({})).toBe(DEFAULT_SITE_BACKGROUND)
      expect(resolveSiteBackground(null)).toBe(DEFAULT_SITE_BACKGROUND)
      expect(resolveSiteBackground(undefined)).toBe(DEFAULT_SITE_BACKGROUND)
    })

    it('does not use the tenant-level accentColor (avoids flooding the page)', () => {
      // A strong tenant accent must not become the page background by accident.
      expect(resolveSiteBackground({}, { accentColor: '#FF0000' })).toBe(DEFAULT_SITE_BACKGROUND)
    })

    it('honours a tenant-level backgroundColor as a last resort', () => {
      expect(resolveSiteBackground({}, { backgroundColor: '#333333' })).toBe('#333333')
    })

    it('keeps the historical default value', () => {
      expect(DEFAULT_SITE_BACKGROUND).toBe('#FBFCFE')
    })
  })

  // -------------------------------------------------------------------------
  // Editor -> configuration
  // -------------------------------------------------------------------------
  it('the editor writes the theme.backgroundColor field', () => {
    const config = updateBackground(createDefaultWebsiteConfig(), '#FF00AA')
    expect(config.theme.backgroundColor).toBe('#FF00AA')
  })

  it('does not touch the primary color or any other theme field', () => {
    const before = applyPreset(createDefaultWebsiteConfig(), 'clinic')
    const after = updateBackground(before, '#FF00AA')
    expect(after.theme.primaryColor).toBe(before.theme.primaryColor)
    expect(after.theme.surfaceColor).toBe(before.theme.surfaceColor)
    expect(after.theme.logo).toBe(before.theme.logo)
  })

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------
  it('the chosen background survives a save/reload round trip', () => {
    const saved = updateBackground(createDefaultWebsiteConfig(), '#123ABC')
    const reloaded = safeParseWebsiteConfig(JSON.parse(JSON.stringify(saved)))!
    expect(reloaded.theme.backgroundColor).toBe('#123ABC')
  })

  it('rejects a malformed background value at the schema boundary', () => {
    expect(safeParseWebsiteConfig({ theme: { backgroundColor: 'red' }, sections: [] })).toBeNull()
    expect(safeParseWebsiteConfig({ theme: { backgroundColor: '#12345' }, sections: [] })).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Rendering: the background is the MAIN canvas, not a small accent
  // -------------------------------------------------------------------------
  it('maps the secondary color to the --site-bg variable', () => {
    const style = rootStyle(updateBackground(createDefaultWebsiteConfig(), '#FF00AA'))
    expect(style['--site-bg']).toBe('#FF00AA')
  })

  it('applies the background to the main website canvas element', () => {
    // The root <main> is the full-page canvas, so this is the whole background,
    // not a decorative element.
    const style = rootStyle(updateBackground(createDefaultWebsiteConfig(), '#FF00AA'))
    expect(style.backgroundColor).toBe('#FF00AA')
  })

  it('changes the background, not only a small accent element', () => {
    const a = rootStyle(updateBackground(createDefaultWebsiteConfig(), '#111111'))
    const b = rootStyle(updateBackground(createDefaultWebsiteConfig(), '#222222'))
    expect(a.backgroundColor).not.toBe(b.backgroundColor)
    expect(a['--site-bg']).not.toBe(b['--site-bg'])
  })

  it('preview (draft config) and live (published config) render their own background', () => {
    const draft = updateBackground(createDefaultWebsiteConfig(), '#AA0000')
    const published = updateBackground(createDefaultWebsiteConfig(), '#00AA00')
    expect(rootStyle(draft).backgroundColor).toBe('#AA0000')
    expect(rootStyle(published).backgroundColor).toBe('#00AA00')
  })

  it('no longer emits the removed --site-accent variable', () => {
    const style = rootStyle(updateBackground(createDefaultWebsiteConfig(), '#FF00AA'))
    expect(style).not.toHaveProperty('--site-accent')
  })

  it('no element consumes --site-accent any more', () => {
    const styles = allStyles(updateBackground(createDefaultWebsiteConfig(), '#FF00AA'))
    expect(styles.some((s) => Object.values(s).includes('var(--site-accent)'))).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Global token isolation
  // -------------------------------------------------------------------------
  it('never overrides the application-level --primary or --accent tokens', () => {
    const style = rootStyle(updateBackground(createDefaultWebsiteConfig(), '#FF00AA'))
    expect(style).not.toHaveProperty('--primary')
    expect(style).not.toHaveProperty('--accent')
    expect(style).not.toHaveProperty('--color-primary')
    expect(style).not.toHaveProperty('--color-accent')
  })

  it('preserves the primary color role for buttons and links', () => {
    const themed = applyPreset(createDefaultWebsiteConfig(), 'salon')
    const style = rootStyle(updateBackground(themed, '#FF00AA'))
    expect(style['--site-primary']).toBe('#DB2777')
  })

  // -------------------------------------------------------------------------
  // Backward compatibility
  // -------------------------------------------------------------------------
  it('legacy configs with only an accentColor use it as the background', () => {
    const legacy = safeParseWebsiteConfig({
      theme: { primaryColor: '#0F766E', accentColor: '#FCE7F3' },
      sections: [],
    })!
    expect(rootStyle(legacy).backgroundColor).toBe('#FCE7F3')
  })

  it('legacy configs with neither color fall back to the historical default', () => {
    const legacy = safeParseWebsiteConfig({ theme: { primaryColor: '#0F766E' }, sections: [] })!
    expect(rootStyle(legacy).backgroundColor).toBe(DEFAULT_SITE_BACKGROUND)
    expect(rootStyle(null).backgroundColor).toBe(DEFAULT_SITE_BACKGROUND)
  })

  it('every legacy accent-only preset value still renders as a background', () => {
    // The previous preset catalog used these accent values; a tenant that saved
    // one must still get a background, not the default.
    for (const accent of ['#F0FAF9', '#FCE7F3', '#DBEAFE', '#FFEDD5', '#EDE9FE']) {
      const legacy = safeParseWebsiteConfig({ theme: { accentColor: accent }, sections: [] })!
      expect(rootStyle(legacy).backgroundColor).toBe(accent)
    }
  })

  // -------------------------------------------------------------------------
  // Presets
  // -------------------------------------------------------------------------
  it('presets set the website background', () => {
    for (const preset of THEME_PRESETS) {
      const style = rootStyle(applyPreset(createDefaultWebsiteConfig(), preset.id))
      expect(style['--site-bg']).toBe(preset.theme.backgroundColor)
      expect(style.backgroundColor).toBe(preset.theme.backgroundColor)
    }
  })

  it('every preset keeps accentColor in sync with backgroundColor', () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.theme.accentColor).toBe(preset.theme.backgroundColor)
    }
  })

  it('presets set a valid hex background', () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.theme.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('a manual background override on top of a preset is respected', () => {
    const themed = applyPreset(createDefaultWebsiteConfig(), 'salon')
    const overridden = updateBackground(themed, '#FF00AA')
    const style = rootStyle(overridden)
    expect(style.backgroundColor).toBe('#FF00AA')
    expect(style['--site-primary']).toBe('#DB2777')
  })

  it('selecting a preset does not overwrite the logo or section content', () => {
    const config = parseWebsiteConfig({
      theme: { logo: 'data:image/png;base64,AA' },
      sections: [{ id: 'sec_hero', type: 'hero', content: { en: { headline: 'Keep me' } } }],
    })
    const themed = applyPreset(config, 'gym')
    expect(themed.theme.logo).toBe('data:image/png;base64,AA')
    expect(themed.sections[0].content.en?.headline).toBe('Keep me')
  })
})
