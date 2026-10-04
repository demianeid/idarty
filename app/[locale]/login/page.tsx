import AuthForm from '@/components/auth-form'
import { isLocale } from '@/lib/i18n'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return null
  return <AuthForm mode="login" locale={locale} />
}
