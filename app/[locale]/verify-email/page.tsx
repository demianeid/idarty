import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { VerifyEmailForm } from '@/components/verify-email-form'
import { safeNextPath } from '@/lib/safe-next'

export default async function VerifyEmailPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ email?: string; next?: string }> }) {
  const { locale } = await params
  const { email, next } = await searchParams
  const nextPath = safeNextPath(next, `/${locale}/onboarding`)
  const rtl = locale === 'ar'
  return <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f7f8f6] px-6 py-10 text-[#17211e]"><div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center"><Link href={`/${locale}`} className="mb-10 text-sm font-bold tracking-[0.18em] text-[#167c72]">idarty</Link><div className="rounded-3xl border border-[#dce5df] bg-paper p-7 shadow-[0_24px_70px_rgba(28,51,44,0.08)]"><h1 className="text-3xl font-semibold">{rtl ? 'تحقق من بريدك الإلكتروني' : 'Verify your email'}</h1><p className="mt-3 text-sm leading-6 text-[#65736d]">{rtl ? 'أرسلنا رابط تحقق إلى بريدك الإلكتروني. تحقق من صندوق الوارد أو أعد الإرسال.' : 'We sent a verification link to your email. Check your inbox or send it again.'}</p><VerifyEmailForm locale={locale} email={email ?? ''} nextPath={nextPath} /></div></div></main>
}
