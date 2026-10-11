import { describe, expect, it } from 'vitest'
import {
  THEME_PRESETS,
  DEFAULT_PRESET_ID,
  applyPreset,
  detectPreset,
  getPreset,
  getPresetIds,
  isPresetId,
} from './theme-presets'
import { parseWebsiteConfig, type WebsiteConfig } from './website-config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A fully-populated config with content, logo, ordering and visibility. */
function richConfig(): WebsiteConfig {
  return parseWebsiteConfig({
    theme: {
      primaryColor: '#111111',
      accentColor: '#222222',
      logo: 'data:image/png;base64,AAAA',
      fontPreset: 'bold',
    },
    sections: [
      {
        id: 'sec_services',
        type: 'services',
        isVisible: false,
        sortOrder: 1,
        content: {
          ar: { heading: 'خدماتنا', description: 'وصف' },
          en: { heading: 'Our services', description: 'Description' },
        },
      },
      {
        id: 'sec_hero',
        type: 'hero',
        isVisible: true,
        sortOrder: 0,
        content: {
          ar: { headline: 'عنوان', tagline: 'شريط', subtitle: 'وصف', ctaLabel: 'احجز' },
          en: { headline: 'Headline', tagline: 'Tagline', subtitle: 'Subtitle', ctaLabel: 'Book' },
        },
      },
    ],
  })
}

describe('theme presets', () => {
  // -------------------------------------------------------------------------
  // 1. Valid, unique identifiers
  // -------------------------------------------------------------------------
  describe('identifiers', () => {
    it('every preset has a non-empty identifier', () => {
      for (const preset of THEME_PRESETS) {
        expect(preset.id).toBeTruthy()
        expect(preset.id.length).toBeGreaterThan(0)
      }
    })

    it('identifiers are unique', () => {
      const ids = THEME_PRESETS.map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('exposes a stable allowlist via getPresetIds', () => {
      expect(getPresetIds()).toEqual(THEME_PRESETS.map((p) => p.id))
    })

    it('includes the documented default preset', () => {
      expect(getPresetIds()).toContain(DEFAULT_PRESET_ID)
    })

    it('isPresetId accepts only allowlisted ids', () => {
      for (const preset of THEME_PRESETS) expect(isPresetId(preset.id)).toBe(true)
      expect(isPresetId('nope')).toBe(false)
      expect(isPresetId('')).toBe(false)
      expect(isPresetId(null)).toBe(false)
      expect(isPresetId(undefined)).toBe(false)
      expect(isPresetId(42)).toBe(false)
      expect(isPresetId({ id: 'salon' })).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // 2. Only supported theme properties
  // -------------------------------------------------------------------------
  describe('supported properties', () => {
    const ALLOWED = ['primaryColor', 'accentColor', 'backgroundColor']

    it('every preset declares only supported properties', () => {
      for (const preset of THEME_PRESETS) {
        for (const key of Object.keys(preset.theme)) {
          expect(ALLOWED).toContain(key)
        }
      }
    })

    it('every preset defines all four presentation colors', () => {
      for (const preset of THEME_PRESETS) {
        for (const key of ALLOWED) {
          expect((preset.theme as Record<string, string>)[key]).toMatch(/^#[0-9a-fA-F]{6}$/)
        }
      }
    })

    it('presets never declare logo, typography, or layout properties', () => {
      for (const preset of THEME_PRESETS) {
        expect(preset.theme).not.toHaveProperty('logo')
        expect(preset.theme).not.toHaveProperty('fontPreset')
        expect(preset.theme).not.toHaveProperty('buttonStyle')
        expect(preset.theme).not.toHaveProperty('borderRadius')
      }
    })

    it('every preset is accepted by the website config schema', () => {
      for (const preset of THEME_PRESETS) {
        const parsed = parseWebsiteConfig({ theme: preset.theme, sections: [] })
        expect(parsed.theme.primaryColor).toBe(preset.theme.primaryColor)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 3. Selecting a preset updates the intended settings
  // -------------------------------------------------------------------------
  describe('applyPreset', () => {
    it('applies the preset theme colors', () => {
      const preset = getPreset('clinic')!
      const result = applyPreset(richConfig(), 'clinic')
      expect(result.theme.primaryColor).toBe(preset.theme.primaryColor)
      expect(result.theme.accentColor).toBe(preset.theme.accentColor)
      expect(result.theme.backgroundColor).toBe(preset.theme.backgroundColor)
    })

    it('sets the website background for every preset', () => {
      for (const preset of THEME_PRESETS) {
        const result = applyPreset(richConfig(), preset.id)
        expect(result.theme.backgroundColor).toBe(preset.theme.backgroundColor)
      }
    })

    it('is stable across every preset in the catalog', () => {
      for (const preset of THEME_PRESETS) {
        const result = applyPreset(richConfig(), preset.id)
        expect(result.theme.primaryColor).toBe(preset.theme.primaryColor)
        expect(detectPreset(result)).toBe(preset.id)
      }
    })

    it('does not mutate the input configuration', () => {
      const input = richConfig()
      const snapshot = JSON.stringify(input)
      applyPreset(input, 'gym')
      expect(JSON.stringify(input)).toBe(snapshot)
    })
  })

  // -------------------------------------------------------------------------
  // 4-6. Preservation of content and unrelated fields
  // -------------------------------------------------------------------------
  describe('preservation', () => {
    it('preserves Arabic and English section content', () => {
      const input = richConfig()
      const result = applyPreset(input, 'salon')
      const hero = result.sections.find((s) => s.type === 'hero')!
      expect(hero.content.ar).toEqual(input.sections.find((s) => s.type === 'hero')!.content.ar)
      expect(hero.content.en).toEqual(input.sections.find((s) => s.type === 'hero')!.content.en)
      expect(hero.content.en?.headline).toBe('Headline')
      expect(hero.content.ar?.headline).toBe('عنوان')
    })

    it('preserves the tenant logo', () => {
      const result = applyPreset(richConfig(), 'studio')
      expect(result.theme.logo).toBe('data:image/png;base64,AAAA')
    })

    it('preserves section visibility', () => {
      const result = applyPreset(richConfig(), 'salon')
      expect(result.sections.find((s) => s.type === 'services')!.isVisible).toBe(false)
      expect(result.sections.find((s) => s.type === 'hero')!.isVisible).toBe(true)
    })

    it('preserves section ordering', () => {
      const result = applyPreset(richConfig(), 'salon')
      expect(result.sections.map((s) => s.id)).toEqual(['sec_services', 'sec_hero'])
      expect(result.sections.map((s) => s.sortOrder)).toEqual([1, 0])
    })

    it('preserves unrelated theme fields', () => {
      const result = applyPreset(richConfig(), 'clinic')
      expect(result.theme.fontPreset).toBe('bold')
    })

    it('preserves the services section heading and description in both languages', () => {
      const result = applyPreset(richConfig(), 'gym')
      const services = result.sections.find((s) => s.type === 'services')!
      expect(services.content.ar?.heading).toBe('خدماتنا')
      expect(services.content.en?.description).toBe('Description')
    })

    it('keeps the same number of sections', () => {
      const input = richConfig()
      const result = applyPreset(input, 'salon')
      expect(result.sections).toHaveLength(input.sections.length)
    })
  })

  // -------------------------------------------------------------------------
  // 7. Invalid identifiers rejected safely
  // -------------------------------------------------------------------------
  describe('invalid identifiers', () => {
    it('returns the config unchanged for an unknown id', () => {
      const input = richConfig()
      const result = applyPreset(input, 'not-a-preset')
      expect(result).toEqual(input)
    })

    it('returns the config unchanged for an empty id', () => {
      const input = richConfig()
      expect(applyPreset(input, '')).toEqual(input)
    })

    it('cannot be used to inject arbitrary theme properties', () => {
      const input = richConfig()
      const result = applyPreset(input, '--evil: url(javascript:alert(1))')
      expect(result).toEqual(input)
      expect(result.theme.primaryColor).toBe('#111111')
    })

    it('getPreset returns null for unknown ids', () => {
      expect(getPreset('nope')).toBeNull()
      expect(getPreset('')).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // detectPreset
  // -------------------------------------------------------------------------
  describe('detectPreset', () => {
    it('detects a preset that was just applied', () => {
      const result = applyPreset(richConfig(), 'gym')
      expect(detectPreset(result)).toBe('gym')
    })

    it('returns null when the theme matches no preset', () => {
      const config = parseWebsiteConfig({
        theme: { primaryColor: '#ABCDEF', accentColor: '#123456' },
        sections: [],
      })
      expect(detectPreset(config)).toBeNull()
    })

    it('returns the default preset for the default palette', () => {
      const preset = getPreset(DEFAULT_PRESET_ID)!
      const config = parseWebsiteConfig({ theme: preset.theme, sections: [] })
      expect(detectPreset(config)).toBe(DEFAULT_PRESET_ID)
    })
  })
})
