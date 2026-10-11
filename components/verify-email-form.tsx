'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Check,
  RotateCcw,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Logo } from '@/components/logo'

export interface VerifyEmailCardProps {
  locale: 'ar' | 'en'
  email: string
  nextPath?: string
  initialError?: string
}

const copy = {
  ar: {
    kicker: 'مساحة عمل هادئة وآمنة',
    title: 'تحقق من بريدك الإلكتروني',
    sentTo: 'أرسلنا رابط التحقق إلى:',
    noEmail: 'أدخل بريدك الإلكتروني لتلقي رابط التحقق:',
    instruction: 'يرجى مراجعة صندوق الوارد والضغط على الرابط لتأكيد بريدك الإلكتروني ومتابعة الإعداد.',
    waiting: 'بانتظار تأكيد الرابط...',
    verifiedSuccess: 'تم تأكيد البريد الإلكتروني بنجاح! جاري توجيهك...',
    resend: 'إعادة إرسال رابط التحقق',
    resending: 'جارٍ إرسال الرابط...',
    resendCooldown: (seconds: number) => `يمكنك إعادة الإرسال بعد ${seconds} ثانية`,
    resendSuccess: 'تم إرسال رابط تحقق جديد بنجاح! يرجى مراجعة بريدك.',
    resendError: 'تعذر إرسال الرابط. قد تكون تجاوزت الحد المسموح به، يرجى الانتظار قليلاً.',
    spamHint: 'لم تجد الرسالة؟ تحقق من مجلد الرسائل الترويجية أو غير المرغوب فيها (Spam).',
    changeEmail: 'تعديل البريد',
    saveEmail: 'حفظ',
    cancelEdit: 'إلغاء',
    wrongEmail: 'أدخلت بريداً خاطئاً؟',
    createNew: 'إنشاء حساب جديد',
    backToLogin: 'العودة لتسجيل الدخول',
    errors: {
      TOKEN_EXPIRED: 'انتهت صلاحية رابط التحقق. لأسباب أمنية تنتهي صلاحية الروابط تلقائياً. يرجى طلب رابط جديد أدناه.',
      INVALID_TOKEN: 'رابط التحقق غير صالح أو قد تم استخدامه مسبقاً. يرجى طلب رابط جديد.',
      USER_NOT_FOUND: 'لم يتم العثور على الحساب المرتبط بهذا الرابط. يرجى التأكد من البريد أو إنشاء حساب جديد.',
      GENERIC: 'حدث خطأ أثناء محاولة التحقق. يرجى طلب رابط جديد والمحاولة مرة أخرى.',
    },
  },
  en: {
    kicker: 'A calm, secure workspace',
    title: 'Check your email',
    sentTo: "We've sent a verification link to:",
    noEmail: 'Enter your email to receive a verification link:',
    instruction: 'Please check your inbox (and spam or junk folder) and click the link to verify your email address.',
    waiting: 'Waiting for verification...',
    verifiedSuccess: 'Email verified successfully! Redirecting...',
    resend: 'Resend verification email',
    resending: 'Sending link...',
    resendCooldown: (seconds: number) => `Resend available in ${seconds}s`,
    resendSuccess: 'A new verification link has been sent! Please check your inbox.',
    resendError: 'Unable to resend email. You may have exceeded the rate limit, please wait a moment.',
    spamHint: "Didn't receive the email? Check your spam folder or try again later.",
    changeEmail: 'Change email',
    saveEmail: 'Save',
    cancelEdit: 'Cancel',
    wrongEmail: 'Wrong email address?',
    createNew: 'Create a new account',
    backToLogin: 'Back to Sign in',
    errors: {
      TOKEN_EXPIRED: 'Your verification link has expired for security reasons. Please request a new link below.',
      INVALID_TOKEN: 'This verification link is invalid or has already been used. Please request a new link below.',
      USER_NOT_FOUND: 'No account was found for this link. Please check your email or register again.',
      GENERIC: 'A verification error occurred. Please request a new link and try again.',
    },
  },
} as const

const COOLDOWN_DURATION = 60

export function VerifyEmailCard({
  locale,
  email: initialEmail,
  nextPath = `/${locale}/onboarding`,
  initialError,
}: VerifyEmailCardProps) {
  const router = useRouter()
  const t = copy[locale]
  const rtl = locale === 'ar'

  const [currentEmail, setCurrentEmail] = useState(initialEmail)
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState(initialEmail)

  const [pending, setPending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [resendError, setResendError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [isVerified, setIsVerified] = useState(false)

  // Storage key for resend cooldown to persist across browser reloads
  const getCooldownStorageKey = (targetEmail: string) =>
    `idarty_resend_cd_${targetEmail.toLowerCase().trim() || 'default'}`

  // Check stored cooldown on mount or email change
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = getCooldownStorageKey(currentEmail)
    const storedExpiry = sessionStorage.getItem(key)
    if (storedExpiry) {
      const remaining = Math.ceil((parseInt(storedExpiry, 10) - Date.now()) / 1000)
      if (remaining > 0) {
        setCooldown(remaining)
      } else {
        sessionStorage.removeItem(key)
      }
    }
  }, [currentEmail])

  // Cooldown countdown tick
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem(getCooldownStorageKey(currentEmail))
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown, currentEmail])

  // Polling: detect if the user clicked the verification link in another tab or device.
  // Only redirect when the session belongs to the SAME email that was submitted for
  // verification. A stale session from a different user must not authorize this flow.
  useEffect(() => {
    if (isVerified) return

    const pollInterval = setInterval(async () => {
      try {
        const session = await authClient.getSession()
        const sessionUser = session.data?.user
        if (
          sessionUser &&
          (sessionUser as any).emailVerified &&
          initialEmail &&
          sessionUser.email === initialEmail
        ) {
          setIsVerified(true)
          clearInterval(pollInterval)
          setTimeout(() => {
            router.push(nextPath)
            router.refresh()
          }, 1200)
        }
      } catch {
        // Silently ignore background polling errors
      }
    }, 4000)

    return () => clearInterval(pollInterval)
  }, [isVerified, nextPath, router, initialEmail])

  // Resend verification email handler
  async function handleResend() {
    const targetEmail = currentEmail.trim()
    if (!targetEmail || cooldown > 0 || pending) return

    setPending(true)
    setSentSuccess(false)
    setResendError('')

    try {
      const result = await authClient.sendVerificationEmail({
        email: targetEmail,
        callbackURL: nextPath,
      })

      if (result.error) {
        setResendError(result.error.message || t.resendError)
      } else {
        setSentSuccess(true)
        const expiry = Date.now() + COOLDOWN_DURATION * 1000
        sessionStorage.setItem(getCooldownStorageKey(targetEmail), expiry.toString())
        setCooldown(COOLDOWN_DURATION)
      }
    } catch {
      setResendError(t.resendError)
    } finally {
      setPending(false)
    }
  }

  // Handle saving new email if edited
  function handleSaveEmail() {
    if (!emailInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) return
    setCurrentEmail(emailInput.trim())
    setEditingEmail(false)
    setSentSuccess(false)
    setResendError('')
  }

  // Localized error message mapping
  const errorBanner = initialError
    ? initialError === 'TOKEN_EXPIRED'
      ? t.errors.TOKEN_EXPIRED
      : initialError === 'INVALID_TOKEN'
        ? t.errors.INVALID_TOKEN
        : initialError === 'USER_NOT_FOUND'
          ? t.errors.USER_NOT_FOUND
          : t.errors.GENERIC
    : null

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight

  return (
    <div className="w-full">
      <Link
        href="/"
        className="mb-8 inline-flex items-center rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-teal/30"
        aria-label={locale === 'ar' ? 'الرئيسية - إدارتي' : 'Home - Idarty'}
      >
        <Logo locale={locale} height={32} />
      </Link>

      <div className="rounded-3xl border border-border bg-paper p-8 shadow-[0_8px_30px_rgba(11,11,15,0.04)] sm:p-10">
        {/* Verification Icon Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
            <Mail className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-teal opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-brand-teal" />
            </span>
          </div>

          <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-bold tracking-wide text-brand-teal uppercase">
            {t.kicker}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
          {t.title}
        </h1>

        {/* Initial Error State Banner (e.g. Expired or Invalid Link) */}
        {errorBanner && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="leading-relaxed font-medium">{errorBanner}</div>
          </div>
        )}

        {/* Verified Success State (auto-polling caught verification) */}
        {isVerified && (
          <div
            role="status"
            className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 animate-in fade-in zoom-in-95 duration-200"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{t.verifiedSuccess}</span>
          </div>
        )}

        {/* Email Display / Edit Field */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ink-muted">
            {currentEmail ? t.sentTo : t.noEmail}
          </p>

          {editingEmail ? (
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-teal focus:bg-paper focus:ring-4 focus:ring-brand-teal/10"
                placeholder="name@example.com"
              />
              <button
                type="button"
                onClick={handleSaveEmail}
                className="shrink-0 rounded-2xl bg-brand-teal px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-teal/90"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailInput(currentEmail)
                  setEditingEmail(false)
                }}
                className="shrink-0 rounded-2xl border border-border px-3.5 py-3 text-sm font-semibold text-ink-muted transition hover:bg-surface"
              >
                {t.cancelEdit}
              </button>
            </div>
          ) : (
            <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-3 text-sm font-semibold text-ink">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="h-4 w-4 shrink-0 text-brand-teal" />
                <span className="truncate">{currentEmail || '—'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmailInput(currentEmail)
                  setEditingEmail(true)
                }}
                className="ms-2 inline-flex items-center gap-1 text-xs font-bold text-brand-teal hover:underline shrink-0"
              >
                <Edit2 className="h-3 w-3" />
                <span>{t.changeEmail}</span>
              </button>
            </div>
          )}
        </div>

        {/* Instruction copy */}
        <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">
          {t.instruction}
        </p>

        {/* Professional radar waiting indicator */}
        {!isVerified && (
          <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-surface/70 px-3.5 py-2.5 text-xs font-semibold text-ink-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-teal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-teal" />
            </span>
            <span>{t.waiting}</span>
          </div>
        )}

        {/* Resend success alert */}
        {sentSuccess && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{t.resendSuccess}</span>
          </div>
        )}

        {/* Resend error alert */}
        {resendError && (
          <div
            role="alert"
            className="mt-5 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{resendError}</span>
          </div>
        )}

        {/* Resend Button Action with Cooldown */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={pending || cooldown > 0 || !currentEmail}
            className="w-full rounded-2xl bg-brand-teal px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t.resending}</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="h-5 w-5" />
                <span>{t.resendCooldown(cooldown)}</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-5 w-5" />
                <span>{t.resend}</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-ink-muted leading-relaxed">
            {t.spamHint}
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Secondary Navigation Options */}
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between text-sm">
          <div className="text-ink-muted">
            <span>{t.wrongEmail} </span>
            <Link
              href={`/${locale}/signup`}
              className="font-bold text-brand-teal hover:underline"
            >
              {t.createNew}
            </Link>
          </div>

          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center justify-center gap-1.5 font-bold text-ink-muted transition-colors hover:text-ink"
          >
            <span>{t.backToLogin}</span>
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// Backward-compatible export alias for any components importing VerifyEmailForm
export const VerifyEmailForm = VerifyEmailCard
