import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { memberships } from '@/lib/db/schema'
import { Building2, ShieldCheck } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const session = await requireSession(await headers())
  const existingMembership = await db.select({ tenantId: memberships.tenantId }).from(memberships).where(eq(memberships.userId, session.user.id)).limit(1)
  if (existingMembership[0]) redirect(`/${locale}/dashboard`)
  const rtl = locale === 'ar'
  return <main className="min-h-screen bg-[#f7f8fb] text-[#172033]" dir={rtl ? 'rtl' : 'ltr'}>
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <div className="flex items-center justify-between"><Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold text-[#315efb]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315efb] text-sm font-bold text-white">id</span> idarty</Link><span className="text-xs font-medium text-[#8993a5]">{rtl ? 'الخطوة ١ من ٣' : 'Step 1 of 3'}</span></div>
      <div className="mt-16 rounded-3xl border border-[#e7eaf0] bg-white p-7 shadow-[0_18px_50px_rgba(30,45,80,.06)] sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]"><Building2 className="h-6 w-6" /></div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{rtl ? 'أنشئ مساحة العمل الأولى' : 'Create your first workspace'}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#758096]">{rtl ? 'مساحتك تجمع فريقك وبياناتك وسير العمل في مكان واحد.' : 'Bring your team, data, and daily workflows together in one calm workspace.'}</p>
        <OnboardingForm locale={locale} />
        <div className="mt-6 flex items-center gap-2 text-xs text-[#8993a5]"><ShieldCheck className="h-4 w-4 text-[#35a672]" />{rtl ? 'يمكنك تغيير هذه المعلومات لاحقاً' : 'You can change these details later'}</div>
      </div>
      <div className="mt-7 flex justify-center gap-2"><span className="h-1.5 w-8 rounded-full bg-[#315efb]" /><span className="h-1.5 w-8 rounded-full bg-[#dfe4ee]" /><span className="h-1.5 w-8 rounded-full bg-[#dfe4ee]" /></div>
    </div>
  </main>
} 

