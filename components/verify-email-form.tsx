'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function VerifyEmailForm({ locale, email }: { locale: 'ar' | 'en'; email: string }) {
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  async function resend() {
    if (!email) return
    setPending(true)
    await authClient.sendVerificationEmail({ email, callbackURL: `/${locale}/onboarding` })
    setPending(false)
    setSent(true)
  }
  return <div className="mt-7 space-y-4"><p className="rounded-xl bg-[#f1f7f2] px-4 py-3 text-sm text-[#287351]">{email || (locale === 'ar' ? 'بريدك الإلكتروني' : 'your email')}</p><button type="button" disabled={pending || !email} onClick={resend} className="w-full rounded-xl bg-[#167c72] px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? (locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...') : (locale === 'ar' ? 'إعادة إرسال رابط التحقق' : 'Resend verification link')}</button>{sent && <p role="status" className="text-sm text-[#287351]">{locale === 'ar' ? 'تم إرسال الرابط.' : 'The link was sent.'}</p>}</div>
}
