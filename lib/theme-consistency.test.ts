import { describe, expect, it } from 'vitest'
import { TenantWebsite } from '@/components/tenant-website'
import {
  createDefaultWebsiteConfig,
  parseWebsiteConfig,
  safeParseWebsiteConfig,
  type WebsiteConfig,
} from './website-config'
import { THEME_PRESETS, applyPreset } from './theme-presets'

// ---------------------------------------------------------------------------
// Theme consistency across the public tenant website
//
// DESIGN RULE: exactly two user-controlled colors.
//   - primaryColor  -> buttons, links, icons, borders
//   - background    -> the GLOBAL background of every major section
//
// There must be no second section-background variable, and no major section may
// carry its own inline background, otherwise a previous preset's color leaks in.
//
// These tests walk the REAL renderer output and inspect every element.
// ---------------------------------------------------------------------------

const baseProps = {
  locale: 'ar' as const,
  slug: 'demo-salon',
  tenant: { currency: 'EGP', email: null, phoneE164: null, theme: null },
  translation: { name: 'صالون', tagline: null, description: null, address: null },
  serviceRows: [
    { id: 's1', name: 'خدمة', description: 'وصف', durationMin: 60, priceAmount: '100' },
    { id: 's2', name: 'خدمة ٢', description: null, durationMin: 30, priceAmount: '200' },
  ],
  hoursRows: [{ weekday: 0, startTime: '09:00', endTime: '17:00' }],
}

interface Collected {
  /** Every element with an inline backgroundColor. */
  bgElements: Array<{ type: unknown; value: unknown }>
  /** Every <section> element and its inline style. */
  sections: Array<{ style: Record<string, unknown> | undefined }>
  /** Every element's className + style, for card/button checks. */
  all: Array<{ type: unknown; className?: string; style?: Record<string, unknown> }>
}

function collect(config: WebsiteConfig | null): Collected {
  const el = TenantWebsite({ ...baseProps, config })
  const out: Collected = { bgElements: [], sections: [], all: [] }
  const walk = (node: unknown, depth = 0) => {
    if (depth > 16 || node === null || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach((c) => walk(c, depth + 1))
    const n = node as { type?: unknown; props?: { style?: Record<string, unknown>; className?: string; children?: unknown } }
    const style = n.props?.style
    const className = n.props?.className
    if (n.type) out.all.push({ type: n.type, className, style })
    if (style && 'backgroundColor' in style) {
      out.bgElements.push({ type: n.type, value: style.backgroundColor })
    }
    if (n.type === 'section') out.sections.push({ style })
    if (n.props) walk(n.props.children, depth + 1)
  }
  walk(el)
  return out
}

describe('theme consistency: one global background', () => {
  // -------------------------------------------------------------------------
  // Section backgrounds
  // -------------------------------------------------------------------------
  it('no major section carries its own inline background', () => {
    const { sections } = collect(applyPreset(createDefaultWebsiteConfig(), 'clinic'))
    expect(sections.length).toBeGreaterThan(0)
    for (const section of sections) {
      expect(section.style?.backgroundColor).toBeUndefined()
    }
  })

  it('hero and services resolve to the same global background', () => {
    const config = applyPreset(createDefaultWebsiteConfig(), 'gym')
    const { bgElements, sections } = collect(config)
    // Neither section paints a background of its own...
    for (const section of sections) {
      expect(section.style?.backgroundColor).toBeUndefined()
    }
    // ...and the only full-canvas background is the preset's global background.
    const canvas = bgElements.filter((e) => e.type === 'main')
    expect(canvas).toHaveLength(1)
    expect(canvas[0].value).toBe(config.theme.backgroundColor)
  })

  it('the global background is applied to the main canvas for every preset', () => {
    for (const preset of THEME_PRESETS) {
      const config = applyPreset(createDefaultWebsiteConfig(), preset.id)
      const { bgElements } = collect(config)
      const canvas = bgElements.find((e) => e.type === 'main')
      expect(canvas?.value).toBe(preset.theme.backgroundColor)
    }
  })

  it('switching between presets leaves no stale major-section background', () => {
    // Render each preset and record the full set of inline background values.
    const backgroundsFor = (id: string) =>
      collect(applyPreset(createDefaultWebsiteConfig(), id)).bgElements.map((e) => e.value)

    const salon = backgroundsFor('salon')
    const clinic = backgroundsFor('clinic')

    // The only non-primary background is the canvas; nothing from 'salon'
    // survives into a 'clinic' render.
    expect(salon).toContain('#FFF7FB')
    expect(clinic).not.toContain('#FFF7FB')
    expect(clinic).toContain('#F7FAFF')
    expect(salon).not.toContain('#F7FAFF')
  })

  it('repeated preset changes always produce a consistent background', () => {
    let config = createDefaultWebsiteConfig()
    const seen: string[] = []
    for (const id of ['salon', 'clinic', 'gym', 'studio', 'default', 'clinic']) {
      config = applyPreset(config, id)
      const canvas = collect(config).bgElements.find((e) => e.type === 'main')
      seen.push(String(canvas?.value))
      // Every render has exactly one canvas background matching the preset.
      expect(canvas?.value).toBe(THEME_PRESETS.find((p) => p.id === id)!.theme.backgroundColor)
    }
    expect(seen).toEqual(['#FFF7FB', '#F7FAFF', '#FFFBF5', '#FAF8FF', '#FBFCFE', '#F7FAFF'])
  })

  it('changing only the background does not create a section-specific color', () => {
    const config: WebsiteConfig = {
      ...createDefaultWebsiteConfig(),
      theme: { ...createDefaultWebsiteConfig().theme, backgroundColor: '#FF00AA' },
    }
    const { bgElements, sections } = collect(config)
    for (const section of sections) expect(section.style?.backgroundColor).toBeUndefined()
    expect(bgElements.find((e) => e.type === 'main')?.value).toBe('#FF00AA')
  })

  // -------------------------------------------------------------------------
  // The removed surface variable
  // -------------------------------------------------------------------------
  it('no --site-surface variable is emitted', () => {
    const el = TenantWebsite({
      ...baseProps,
      config: { ...createDefaultWebsiteConfig(), theme: { surfaceColor: '#FF0000' } },
    }) as React.ReactElement<{ style: Record<string, unknown> }>
    expect(el.props.style).not.toHaveProperty('--site-surface')
  })

  it('a legacy stored surfaceColor cannot repaint a section', () => {
    // Old configs may carry surfaceColor; it must be inert now.
    const legacy = safeParseWebsiteConfig({
      theme: { backgroundColor: '#FFFFFF', surfaceColor: '#123456' },
      sections: [{ id: 's1', type: 'services', content: {} }],
    })!
    const { bgElements, sections } = collect(legacy)
    for (const section of sections) expect(section.style?.backgroundColor).toBeUndefined()
    expect(bgElements.map((e) => e.value)).not.toContain('#123456')
  })

  // -------------------------------------------------------------------------
  // Neutrals and primary roles preserved
  // -------------------------------------------------------------------------
  it('service cards keep a neutral surface, not a primary-colored one', () => {
    const { all } = collect(applyPreset(createDefaultWebsiteConfig(), 'clinic'))
    const cards = all.filter((e) => typeof e.className === 'string' && e.className.includes('bg-paper'))
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) {
      expect(card.style?.backgroundColor).toBeUndefined()
    }
  })

  it('primary buttons still use the primary color', () => {
    const config = applyPreset(createDefaultWebsiteConfig(), 'salon')
    const { bgElements } = collect(config)
    const primaryBg = bgElements.filter((e) => e.value === 'var(--site-primary)')
    // Booking CTA in the header + hero CTA + per-service book buttons.
    expect(primaryBg.length).toBeGreaterThanOrEqual(3)
  })

  it('the primary color is never used as a page/section background', () => {
    for (const preset of THEME_PRESETS) {
      const config = applyPreset(createDefaultWebsiteConfig(), preset.id)
      const canvas = collect(config).bgElements.find((e) => e.type === 'main')
      expect(canvas?.value).not.toBe('var(--site-primary)')
      expect(canvas?.value).toBe(preset.theme.backgroundColor)
    }
  })

  // -------------------------------------------------------------------------
  // Backward compatibility + draft/published isolation
  // -------------------------------------------------------------------------
  it('legacy configurations still resolve a valid background', () => {
    const legacyAccentOnly = safeParseWebsiteConfig({ theme: { accentColor: '#FCE7F3' }, sections: [] })!
    const bare = safeParseWebsiteConfig({ theme: {}, sections: [] })!
    expect(collect(legacyAccentOnly).bgElements.find((e) => e.type === 'main')?.value).toBe('#FCE7F3')
    expect(collect(bare).bgElements.find((e) => e.type === 'main')?.value).toBe('#FBFCFE')
    expect(collect(null).bgElements.find((e) => e.type === 'main')?.value).toBe('#FBFCFE')
  })

  it('draft and published configurations render independently', () => {
    const draft = parseWebsiteConfig({
      theme: { primaryColor: '#DB2777', backgroundColor: '#FFF7FB' },
      sections: [],
    })
    const published = parseWebsiteConfig({
      theme: { primaryColor: '#2563EB', backgroundColor: '#F7FAFF' },
      sections: [],
    })
    const draftCanvas = collect(draft).bgElements.find((e) => e.type === 'main')
    const publishedCanvas = collect(published).bgElements.find((e) => e.type === 'main')
    expect(draftCanvas?.value).toBe('#FFF7FB')
    expect(publishedCanvas?.value).toBe('#F7FAFF')
    expect(draftCanvas?.value).not.toBe(publishedCanvas?.value)
  })

  it('a preset applied to the draft does not change the published render', () => {
    const published = applyPreset(createDefaultWebsiteConfig(), 'default')
    const draft = applyPreset(published, 'salon')
    // The published config is untouched by the draft edit.
    expect(published.theme.backgroundColor).toBe('#FBFCFE')
    expect(collect(published).bgElements.find((e) => e.type === 'main')?.value).toBe('#FBFCFE')
    expect(collect(draft).bgElements.find((e) => e.type === 'main')?.value).toBe('#FFF7FB')
  })

  // -------------------------------------------------------------------------
  // Preset integrity
  // -------------------------------------------------------------------------
  it('every preset defines only primary + background (accent kept in sync)', () => {
    for (const preset of THEME_PRESETS) {
      expect(Object.keys(preset.theme).sort()).toEqual(['accentColor', 'backgroundColor', 'primaryColor'])
      expect(preset.theme.accentColor).toBe(preset.theme.backgroundColor)
      expect(preset.theme.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(preset.theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('presets never declare a section-surface property', () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.theme).not.toHaveProperty('surfaceColor')
    }
  })

  it('applying a preset preserves logo, content, visibility and order', () => {
    const config = parseWebsiteConfig({
      theme: { logo: 'data:image/png;base64,AA' },
      sections: [
        { id: 'a', type: 'services', isVisible: false, sortOrder: 1, content: { en: { heading: 'Keep' } } },
        { id: 'b', type: 'hero', isVisible: true, sortOrder: 0, content: { en: { headline: 'Keep me' } } },
      ],
    })
    const themed = applyPreset(config, 'studio')
    expect(themed.theme.logo).toBe('data:image/png;base64,AA')
    expect(themed.sections.map((s) => s.id)).toEqual(['a', 'b'])
    expect(themed.sections.find((s) => s.id === 'a')!.isVisible).toBe(false)
    expect(themed.sections.find((s) => s.id === 'a')!.content.en?.heading).toBe('Keep')
    expect(themed.sections.find((s) => s.id === 'b')!.content.en?.headline).toBe('Keep me')
  })
})
