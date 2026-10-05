import { describe, expect, it } from 'vitest'
import { getLocaleFromAcceptLanguage, localeDirection, normalizeLocale, supportedLocales } from './i18n'

describe('locale utilities', () => {
  it('keeps only supported locales', () => {
    expect(supportedLocales).toEqual(['ar', 'en'])
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('fr')).toBe('ar')
  })

  it('prefers Arabic when the header is Arabic', () => {
    expect(getLocaleFromAcceptLanguage('ar-EG, en;q=0.8')).toBe('ar')
    expect(getLocaleFromAcceptLanguage('en-US, ar;q=0.7')).toBe('en')
    expect(getLocaleFromAcceptLanguage(undefined)).toBe('ar')
  })

  it('maps each locale to the correct writing direction', () => {
    expect(localeDirection('ar')).toBe('rtl')
    expect(localeDirection('en')).toBe('ltr')
  })
})
