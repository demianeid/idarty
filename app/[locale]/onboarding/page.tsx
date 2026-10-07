import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { memberships } from '@/lib/db/schema'
import { Building2, ShieldCheck } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ error?: string }>
}) {
  const { locale } = await params
  const { error } = await searchParams

  if (error) {
    redirect(`/${locale}/verify-email?error=${encodeURIComponent(error)}`)
  }

  const session = await getSession(await headers())
  if (!session) {
    redirect(`/${locale}/login?next=/${locale}/onboarding`)
  }

  if (session.user.emailVerified === false) {
    redirect(`/${locale}/verify-email?email=${encodeURIComponent(session.user.email)}`)
  }

  const existingMembership = await db.select({ tenantId: memberships.tenantId }).from(memberships).where(eq(memberships.userId, session.user.id)).limit(1)
  if (existingMembership[0]) redirect(`/${locale}/dashboard`)
  const rtl = locale === 'ar'
  const isAdmin = (session.user as any).isPlatformAdmin === true

  return <main className="min-h-screen bg-[#f7f8fb] text-[#172033]" dir={rtl ? 'rtl' : 'ltr'}>
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      {isAdmin && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {rtl ? 'أنت مدير المنصة — يمكنك الوصول للوحة الإدارة مباشرة.' : 'You are a platform admin — you can access the admin panel directly.'}
            </p>
          </div>
          <Link href={`/${locale}/admin`} className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700">
            {rtl ? 'لوحة الإدارة' : 'Admin Panel'}
          </Link>
        </div>
      )}
      <OnboardingForm locale={locale} />
    </div>
  </main>
}



