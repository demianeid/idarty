'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function VerifyEmailForm({ locale, email, nextPath = `/${locale}/onboarding` }: { locale: 'ar' | 'en'; email: string; nextPath?: string }) {
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  async function resend() {
    if (!email) return
    setPending(true)
    setSent(false)
    setError(false)
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: nextPath })
      if (result.error) {
        setError(true)
        return
      }
      setSent(true)
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }
  return <div className="mt-7 space-y-4"><p className="rounded-xl bg-[#f1f7f2] px-4 py-3 text-sm text-[#287351]">{email || (locale === 'ar' ? 'بريدك الإلكتروني' : 'your email')}</p><button type="button" disabled={pending || !email} onClick={resend} className="w-full rounded-xl bg-[#167c72] px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? (locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...') : (locale === 'ar' ? 'إعادة إرسال رابط التحقق' : 'Resend verification link')}</button>{sent && <p role="status" className="text-sm text-[#287351]">{locale === 'ar' ? 'تم إرسال الرابط.' : 'The link was sent.'}</p>}{error && <p role="alert" className="text-sm text-[#b42318]">{locale === 'ar' ? 'تعذر إرسال الرسالة. تحقق من إعدادات البريد أو جرّب مرة أخرى.' : 'The email could not be sent. Check the email configuration and try again.'}</p>}</div>
}
