import AuthForm from '@/components/auth-form'
import { isLocale } from '@/lib/i18n'

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return null
  return <AuthForm mode="signup" locale={locale} />
}
