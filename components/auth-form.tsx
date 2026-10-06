'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState, useRef, useEffect } from 'react'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Logo } from '@/components/logo'

export function AuthForm({ mode, locale = 'ar', nextPath = `/${locale}/dashboard` }: { mode: 'login' | 'signup'; locale?: 'ar' | 'en'; nextPath?: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [pending, setPending] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Keyboard accessibility: Auto-focus the first empty field
  useEffect(() => {
    if (mode === 'signup' && nameRef.current) {
      nameRef.current.focus()
    } else if (mode === 'login' && emailRef.current) {
      emailRef.current.focus()
    }
  }, [mode])

  // Inline Validation Rules
  const validateEmail = (val: string) => {
    if (!val) return locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return locale === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'
    return ''
  }

  const validatePassword = (val: string) => {
    if (!val) return locale === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required'
    if (val.length < 8) return locale === 'ar' ? 'يجب أن تتكون من 8 أحرف على الأقل' : 'Must be at least 8 characters'
    return ''
  }

  const handleEmailBlur = () => setEmailError(validateEmail(email))
  const handlePasswordBlur = () => setPasswordError(validatePassword(password))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    // Check validation before submission to reduce unnecessary clicks/requests
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    
    setEmailError(eErr)
    setPasswordError(pErr)
    setGeneralError('')

    if (eErr || pErr) return

    setPending(true)
    
    const result = mode === 'login'
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name, email, password })
      
    setPending(false)
    
    if (result.error) {
      setGeneralError(result.error.message || (locale === 'ar' ? 'تعذر إتمام العملية. تحقق من البيانات وحاول مرة أخرى.' : 'Something went wrong. Please check your details and try again.'))
      return
    }
    
    if (mode === 'signup') {
      router.push(process.env.NODE_ENV === 'production' ? `/${locale}/verify-email?email=${encodeURIComponent(email)}` : nextPath)
    } else {
      router.push(nextPath)
    }
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-10 text-ink" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-10 flex items-start rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-teal/30" aria-label={locale === 'ar' ? 'الرئيسية - إدارتي' : 'Home - Idarty'}>
          <Logo locale={locale} height={32} />
        </Link>

        <div className="rounded-3xl border border-border bg-paper p-8 shadow-[0_8px_30px_rgba(11,11,15,0.04)] transition-all sm:p-10">
          <p className="mb-3 text-xs font-bold tracking-widest text-brand-teal uppercase">
            {locale === 'ar' ? 'مساحة عمل هادئة وآمنة' : 'A calm, secure workspace'}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {mode === 'login' 
              ? (locale === 'ar' ? 'مرحباً بعودتك' : 'Welcome back') 
              : (locale === 'ar' ? 'أنشئ حسابك' : 'Create your account')}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            {mode === 'login' 
              ? (locale === 'ar' ? 'سجّل الدخول لإدارة مساحة عملك براحة بال.' : 'Sign in to manage your workspace with peace of mind.') 
              : (locale === 'ar' ? 'ابدأ بإدارة فريقك وحجوزاتك من مكان واحد بكل سهولة.' : 'Start managing your team and bookings easily in one place.')}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-semibold text-ink">
                  {locale === 'ar' ? 'الاسم' : 'Name'}
                </label>
                <input 
                  id="name"
                  ref={nameRef}
                  required 
                  autoComplete="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-3.5 text-base outline-none transition-colors hover:border-brand-teal/30 focus:border-brand-teal focus:bg-paper focus:ring-4 focus:ring-brand-teal/10" 
                  aria-invalid={false}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-ink">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="relative">
                <input 
                  id="email"
                  ref={emailRef}
                  required 
                  type="email" 
                  autoComplete="email" 
                  spellCheck={false} 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }} 
                  onBlur={handleEmailBlur}
                  className={`w-full rounded-2xl border bg-surface/50 px-4 py-3.5 text-base outline-none transition-colors hover:border-brand-teal/30 focus:bg-paper focus:ring-4 focus:ring-brand-teal/10 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-border focus:border-brand-teal'}`} 
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                {emailError && <AlertCircle className="absolute top-1/2 -translate-y-1/2 end-4 size-5 text-red-500" aria-hidden="true" />}
              </div>
              {emailError && <p id="email-error" role="alert" className="text-sm font-medium text-red-600">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-ink">
                {locale === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input 
                  id="password"
                  required 
                  minLength={8} 
                  type={showPassword ? 'text' : 'password'} 
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} 
                  spellCheck={false} 
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }} 
                  onBlur={handlePasswordBlur}
                  className={`w-full rounded-2xl border bg-surface/50 px-4 py-3.5 pe-12 text-base outline-none transition-colors hover:border-brand-teal/30 focus:bg-paper focus:ring-4 focus:ring-brand-teal/10 ${passwordError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-border focus:border-brand-teal'}`} 
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-2 flex size-9 items-center justify-center rounded-xl text-ink-muted outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-teal"
                  aria-label={showPassword ? (locale === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') : (locale === 'ar' ? 'إظهار كلمة المرور' : 'Show password')}
                >
                  {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </div>
              {passwordError && <p id="password-error" role="alert" className="text-sm font-medium text-red-600">{passwordError}</p>}
            </div>

            {generalError && (
              <div role="alert" aria-live="polite" className="mt-2 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                <p className="font-medium leading-relaxed">{generalError}</p>
              </div>
            )}

            <button 
              disabled={pending} 
              className="group relative mt-2 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-teal px-6 font-bold text-white shadow-[0_4px_14px_rgba(15,118,110,0.25)] outline-none transition-all hover:-translate-y-px hover:bg-[#0d6560] hover:shadow-[0_6px_20px_rgba(15,118,110,0.3)] focus-visible:ring-4 focus-visible:ring-brand-teal/30 disabled:pointer-events-none disabled:opacity-70"
            >
              {pending && <Loader2 className="size-5 animate-spin" />}
              <span className="relative z-10">
                {pending 
                  ? (locale === 'ar' ? 'جارٍ المعالجة...' : 'Processing...') 
                  : mode === 'login' 
                    ? (locale === 'ar' ? 'تسجيل الدخول' : 'Sign in') 
                    : (locale === 'ar' ? 'إنشاء الحساب' : 'Create account')}
              </span>
            </button>
          </form>
          
          <p className="mt-8 text-center text-[15px] text-ink-muted">
            {mode === 'login' 
              ? (locale === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? ") 
              : (locale === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? ')}
            <Link 
              className="rounded font-bold text-brand-teal underline-offset-4 outline-none transition-all hover:underline focus-visible:ring-2 focus-visible:ring-brand-teal" 
              href={mode === 'login' ? `/${locale}/signup` : `/${locale}/login`}
            >
              {mode === 'login' 
                ? (locale === 'ar' ? 'أنشئ حساباً' : 'Create one') 
                : (locale === 'ar' ? 'سجّل الدخول' : 'Sign in')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default AuthForm
