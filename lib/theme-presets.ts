import type { WebsiteConfig, WebsiteThemeOverride } from '@/lib/website-config'

// ---------------------------------------------------------------------------
// Theme presets
//
// A preset is a *presentation-only* bundle of supported theme properties. It is
// applied to the tenant's DRAFT configuration only, and it deliberately touches
// nothing else — logo, section content (Arabic/English), section visibility and
// section ordering are all preserved.
//
// Every property a preset sets is consumed by the shared renderer in
// components/tenant-website.tsx. A preset must never declare a property the
// renderer ignores, otherwise selecting it would silently do nothing.
// ---------------------------------------------------------------------------

/**
 * The theme properties a preset is allowed to define.
 *
 * Only TWO user-controlled colors exist on the public website: `primaryColor`
 * (buttons/links/icons) and the global background. `accentColor` is the legacy
 * name for the background control, kept in sync so older stored configs resolve
 * the same color.
 */
export type PresetThemeProperties = Pick<
  WebsiteThemeOverride,
  'primaryColor' | 'accentColor' | 'backgroundColor'
>

// NOTE: `accentColor` and `backgroundColor` are set to the SAME value in every
// preset. `backgroundColor` is the field the Website Builder's background picker
// writes; `accentColor` is the legacy name for that same control. Keeping them in
// sync means a preset sets the website background whether the config is read by
// the new field or the legacy one.

export interface ThemePreset {
  id: string
  /** Localized display name. */
  name: { ar: string; en: string }
  /** Localized one-line description of the mood/industry fit. */
  description: { ar: string; en: string }
  theme: PresetThemeProperties
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: 'default',
    name: { ar: 'الافتراضي', en: 'Default' },
    description: { ar: 'المظهر الأصلي لإدارتي', en: 'The original Idarty look' },
    theme: {
      primaryColor: '#0F766E',
      accentColor: '#FBFCFE',
      backgroundColor: '#FBFCFE',
    },
  },
  {
    id: 'salon',
    name: { ar: 'صالون وتجميل', en: 'Salon & Beauty' },
    description: { ar: 'وردي ناعم يناسب صالونات التجميل', en: 'Soft rose for beauty salons' },
    theme: {
      primaryColor: '#DB2777',
      accentColor: '#FFF7FB',
      backgroundColor: '#FFF7FB',
    },
  },
  {
    id: 'clinic',
    name: { ar: 'عيادة طبية', en: 'Medical Clinic' },
    description: { ar: 'أزرق هادئ يبعث على الثقة', en: 'Calm, trustworthy blue' },
    theme: {
      primaryColor: '#2563EB',
      accentColor: '#F7FAFF',
      backgroundColor: '#F7FAFF',
    },
  },
  {
    id: 'gym',
    name: { ar: 'نادي رياضي', en: 'Fitness & Gym' },
    description: { ar: 'برتقالي حيوي وطاقة عالية', en: 'Energetic, high-contrast orange' },
    theme: {
      primaryColor: '#EA580C',
      accentColor: '#FFFBF5',
      backgroundColor: '#FFFBF5',
    },
  },
  {
    id: 'studio',
    name: { ar: 'استوديو وعافية', en: 'Studio & Wellness' },
    description: { ar: 'بنفسجي هادئ للاستوديوهات والعافية', en: 'Calm violet for studios and wellness' },
    theme: {
      primaryColor: '#7C3AED',
      accentColor: '#FAF8FF',
      backgroundColor: '#FAF8FF',
    },
  },
] as const

export const DEFAULT_PRESET_ID = 'default'

const PRESET_BY_ID = new Map(THEME_PRESETS.map((preset) => [preset.id, preset]))

/** Fixed allowlist check — never accept an arbitrary preset identifier. */
export function isPresetId(value: unknown): value is string {
  return typeof value === 'string' && PRESET_BY_ID.has(value)
}

export function getPreset(id: string): ThemePreset | null {
  return PRESET_BY_ID.get(id) ?? null
}

export function getPresetIds(): string[] {
  return THEME_PRESETS.map((preset) => preset.id)
}

/**
 * Apply a preset to a website configuration.
 *
 * Presentation-only: the returned configuration has the preset's theme
 * properties merged over the existing theme, and every other field (logo,
 * section content, visibility, ordering, unknown fields) is preserved
 * untouched. The input is never mutated.
 *
 * Returns the original config unchanged when the preset id is not in the
 * allowlist, so an invalid selection can never corrupt a configuration.
 */
export function applyPreset(config: WebsiteConfig, presetId: string): WebsiteConfig {
  const preset = getPreset(presetId)
  if (!preset) return config

  return {
    ...config,
    theme: {
      ...config.theme,
      ...preset.theme,
    },
  }
}

/**
 * Which preset, if any, the configuration's theme currently matches.
 * Returns null when the theme has been manually customized away from every
 * preset, so the editor can show an honest "custom" state.
 */
export function detectPreset(config: WebsiteConfig): string | null {
  const theme = config.theme ?? {}
  const matches = THEME_PRESETS.filter((preset) =>
    (Object.entries(preset.theme) as Array<[keyof PresetThemeProperties, string]>).every(
      ([key, value]) => theme[key] === value
    )
  )
  if (matches.length === 0) return null
  // Prefer the most specific match (a preset that pins more properties).
  return matches[matches.length - 1].id
}
