export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ar'
export const supportedLocales = locales

export function isLocale(value: string | undefined): value is Locale {
  return value === 'ar' || value === 'en'
}

export function localeDirection(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function getLocaleFromHeader(value: string | null) {
  const preferred = value?.split(',')[0]?.trim().split('-')[0]
  return isLocale(preferred) ? preferred : defaultLocale
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value ?? undefined) ? value as Locale : defaultLocale
}

export function getLocaleFromAcceptLanguage(value: string | undefined) {
  return getLocaleFromHeader(value ?? null)
}

export const messages = {
  ar: { appName: 'idarty', signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب' },
  en: { appName: 'idarty', signIn: 'Sign in', signUp: 'Create account' },
} as const

export function t(locale: Locale, key: keyof typeof messages.ar) {
  return messages[locale][key]
}

export function normalizeTenantSlug(value: string) {
  return value.trim().toLowerCase().normalize('NFKC').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63)
}

export function tenantHost(host: string) {
  return host.split(':')[0].split('.')[0] || null
}
