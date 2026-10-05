import AuthForm from '@/components/auth-form'
import { isLocale } from '@/lib/i18n'
import { safeNextPath } from '@/lib/safe-next'

export default async function SignupPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params
  const { next } = await searchParams
  if (!isLocale(locale)) return null
  return <AuthForm mode="signup" locale={locale} nextPath={safeNextPath(next, `/${locale}/dashboard`)} />
}
