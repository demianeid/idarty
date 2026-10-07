import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import type { Locale } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n'
import { VerifyEmailCard } from '@/components/verify-email-form'
import { safeNextPath } from '@/lib/safe-next'

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ email?: string; next?: string; error?: string }>
}) {
  const { locale: rawLocale } = await params
  const { email, next, error } = await searchParams
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'

  const session = await getSession(await headers())
  // If the user already has a session and is already emailVerified, redirect immediately to onboarding
  if (session?.user?.emailVerified) {
    redirect(safeNextPath(next, `/${locale}/onboarding`))
  }

  // Safely extract email from query param or session user
  const safeEmail = email || session?.user?.email || ''
  const nextPath = safeNextPath(next, `/${locale}/onboarding`)

  return (
    <main
      className="min-h-screen bg-surface px-6 py-10 text-ink"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <VerifyEmailCard
          locale={locale}
          email={safeEmail}
          nextPath={nextPath}
          initialError={error}
        />
      </div>
    </main>
  )
}
