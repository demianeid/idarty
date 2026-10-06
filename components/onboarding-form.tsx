'use client'

import { useActionState, useState } from 'react'
import { createTenant, validateSlug } from '@/app/[locale]/onboarding/actions'
import { businessTypes, businessTypeLabels, defaultWorkspacePlaceholder, type BusinessType } from '@/lib/business-types'
import { publicTenantUrl } from '@/lib/routes'
import { Building2, Palette, PartyPopper, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'

const PRESET_COLORS = [
  { label: 'idarty Blue', primary: '#0F766E', accent: '#f0faf9' },
  { label: 'Emerald',     primary: '#059669', accent: '#d1fae5' },
  { label: 'Violet',      primary: '#7c3aed', accent: '#ede9fe' },
  { label: 'Rose',        primary: '#e11d48', accent: '#ffe4e6' },
  { label: 'Amber',       primary: '#d97706', accent: '#fef3c7' },
  { label: 'Slate',       primary: '#475569', accent: '#f1f5f9' },
]

const messages: Record<string, { ar: string; en: string }> = {
  UNAUTHENTICATED: { ar: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', en: 'Your session expired. Please sign in again.' },
  INVALID_SLUG: { ar: 'استخدم رابطاً قصيراً صالحاً بحروف إنجليزية وأرقام وشرطات.', en: 'Use a valid URL with lowercase letters, numbers, and hyphens.' },
  SLUG_RESERVED: { ar: 'هذا الرابط محجوز. اختر رابطاً آخر.', en: 'That URL is reserved. Choose another one.' },
  SLUG_TAKEN: { ar: 'هذا الرابط مستخدم بالفعل. اختر رابطاً آخر.', en: 'That URL is already taken. Choose another one.' },
  UNKNOWN: { ar: 'تعذر إنشاء مساحة العمل. حاول مرة أخرى.', en: 'Could not create the workspace. Please try again.' },
}

export function OnboardingForm({ locale }: { locale: 'ar' | 'en' }) {
  const rtl = locale === 'ar'
  const [state, action, pending] = useActionState(createTenant, null)
  
  const [step, setStep] = useState(1)
  
  // Step 1 state
  const [businessType, setBusinessType] = useState<BusinessType>('salon')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  
  // Step 2 state
  const [primary, setPrimary] = useState('#0F766E')
  const [accent, setAccent] = useState('#f0faf9')
  const [logo, setLogo] = useState('')

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogo(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  async function nextStep() {
    if (step === 1) {
      if (!name || name.length < 2) return
      if (!slug || slug.length < 3) return
      
      setIsValidating(true)
      setSlugError(null)
      const error = await validateSlug(slug)
      setIsValidating(false)
      
      if (error) {
        setSlugError(messages[error][locale])
        return
      }
    }
    setStep((s) => Math.min(3, s + 1))
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1))
  }

  const stepTitles = {
    1: rtl ? 'أنشئ مساحة العمل الأولى' : 'Create your workspace',
    2: rtl ? 'تخصيص الهوية البصرية' : 'Customize your brand',
    3: rtl ? 'أنت جاهز للبدء!' : "You're ready to start!",
  }
  
  const stepDescriptions = {
    1: rtl ? 'مساحتك تجمع فريقك وبياناتك وسير العمل في مكان واحد.' : 'Bring your team, data, and daily workflows together in one calm workspace.',
    2: rtl ? 'اختر الألوان والشعار الخاص بنشاطك التجاري.' : 'Choose colors and a logo for your business.',
    3: rtl ? 'سنقوم بتجهيز كل شيء بناءً على اختياراتك.' : 'We will set everything up based on your choices.',
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <a href={`/${locale}`} className="flex items-center" aria-label={rtl ? 'إدارتي' : 'Idarty'}>
          <Logo locale={locale} height={28} />
        </a>
        <div className="flex items-center gap-2" dir="ltr">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-brand-teal' : 'bg-[#dfe4ee]'}`} />
          ))}
        </div>
      </div>
      
      <div className="mt-12 rounded-[2rem] border border-border bg-paper p-7 shadow-[0_20px_60px_rgba(30,45,80,.05)] sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0faf9] text-brand-teal">
          {step === 1 && <Building2 className="h-7 w-7" />}
          {step === 2 && <Palette className="h-7 w-7" />}
          {step === 3 && <PartyPopper className="h-7 w-7" />}
        </div>
        
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{stepTitles[step as keyof typeof stepTitles]}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-muted">{stepDescriptions[step as keyof typeof stepDescriptions]}</p>
        </div>
        
        <form action={action} className="mt-10 mx-auto max-w-md">
          <input type="hidden" name="locale" value={locale} />
          
          {/* STEP 1: Basic Info */}
          <div className={`space-y-5 ${step === 1 ? 'block' : 'hidden'}`}>
            <label className="block text-sm font-semibold">{rtl ? 'نوع النشاط' : 'Business type'}
              <select name="businessType" value={businessType} onChange={(e) => setBusinessType(e.target.value as BusinessType)} className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] bg-paper px-4 text-sm outline-none transition focus-visible:border-brand-teal focus-visible:ring-4 focus-visible:ring-brand-teal/10">
                {businessTypes.map((type) => <option key={type} value={type}>{businessTypeLabels[type][locale]}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">{rtl ? 'اسم مساحة العمل' : 'Workspace name'}
              <input name="name" autoComplete="organization" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-[#e1e5ed] px-4 text-sm outline-none transition focus-visible:border-brand-teal focus-visible:ring-4 focus-visible:ring-brand-teal/10" placeholder={defaultWorkspacePlaceholder(businessType, locale)} />
            </label>
            <label className="block text-sm font-semibold">{rtl ? 'الرابط المختصر' : 'Workspace URL'}
              <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-[#e1e5ed] focus-within:border-brand-teal focus-within:ring-4 focus-within:ring-brand-teal/10">
                <span className="max-w-[55%] truncate px-4 text-sm text-[#9aa3b2]" dir="ltr">{publicTenantUrl(locale, '')}</span>
                <input name="slug" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); setSlugError(null); }} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={48} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm outline-none placeholder:text-left rtl:text-left rtl:pl-4" placeholder="nile-wellness" dir="ltr" />
              </div>
            </label>
            
            {slugError && <p role="alert" aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{slugError}</p>}
            
            <button type="button" onClick={nextStep} disabled={isValidating} className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-teal text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-[#0d6560] focus-visible:ring-4 focus-visible:ring-brand-teal/20 disabled:opacity-60">
              {isValidating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isValidating ? (rtl ? 'جاري التحقق...' : 'Checking...') : (rtl ? 'التالي' : 'Next step')}
              {!isValidating && (rtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}
            </button>
          </div>

          {/* STEP 2: Branding */}
          <div className={`space-y-6 ${step === 2 ? 'block' : 'hidden'}`}>
            <input type="hidden" name="primaryColor" value={primary} />
            <input type="hidden" name="accentColor" value={accent} />
            <input type="hidden" name="logoBase64" value={logo} />
            
            <div>
              <span className="mb-2 block text-xs font-semibold text-[#647087]">{rtl ? 'شعار مساحة العمل' : 'Workspace logo'}</span>
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e1e5ed] bg-surface">
                  {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-ink-lighter">id</span>}
                </div>
                <div>
                  <label className="cursor-pointer rounded-lg border border-[#e1e5ed] bg-paper px-3 py-1.5 text-xs font-semibold text-[#516078] outline-none transition hover:bg-surface focus-within:ring-2 focus-within:ring-brand-teal/40">
                    {rtl ? 'اختر صورة' : 'Choose image'}
                    <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="mt-2 text-xs text-ink-lighter">{rtl ? 'اختياري (الحد الأقصى 1 ميجابايت)' : 'Optional (Max 1MB)'}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-ink-lighter">{rtl ? 'ألوان جاهزة' : 'Preset palettes'}</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.primary}
                    type="button"
                    title={preset.label}
                    aria-label={preset.label}
                    onClick={() => { setPrimary(preset.primary); setAccent(preset.accent) }}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl shadow-sm outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-teal ${primary === preset.primary ? 'ring-2 ring-offset-2 ring-brand-teal' : ''}`}
                    style={{ background: preset.primary }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button type="button" onClick={prevStep} className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl border border-[#e1e5ed] bg-paper text-sm font-semibold text-[#516078] shadow-sm outline-none transition hover:bg-surface focus-visible:ring-4 focus-visible:ring-brand-teal/20">
                {rtl ? 'السابق' : 'Previous'}
              </button>
              <button type="button" onClick={nextStep} className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-brand-teal text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-[#0d6560] focus-visible:ring-4 focus-visible:ring-brand-teal/20">
                {rtl ? 'التالي' : 'Next step'}
              </button>
            </div>
          </div>

          {/* STEP 3: Submission */}
          <div className={`space-y-6 ${step === 3 ? 'block' : 'hidden'}`}>
            <div className="rounded-2xl border border-border bg-surface p-5 text-center">
              <h3 className="text-sm font-semibold">{name || 'Workspace Name'}</h3>
              <p className="mt-1 text-xs text-ink-lighter" dir="ltr">{publicTenantUrl(locale, slug || 'url')}</p>
              
              <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-xl border border-[#e1e5ed] bg-paper p-3">
                <span className="h-8 w-8 shrink-0 rounded-lg shadow-sm" style={{ background: primary }} />
                <span className="h-8 w-8 shrink-0 rounded-lg border border-[#e1e5ed] shadow-sm" style={{ background: accent }} />
                <span className="text-xs font-medium text-[#647087]">{rtl ? 'ألوان مساحة العمل' : 'Workspace colors'}</span>
              </div>
            </div>

            {state && <p role="alert" aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.message[locale]}</p>}

            <div className="mt-8 flex items-center gap-3">
              <button type="button" onClick={prevStep} disabled={pending} className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl border border-[#e1e5ed] bg-paper text-sm font-semibold text-[#516078] shadow-sm outline-none transition hover:bg-surface focus-visible:ring-4 focus-visible:ring-brand-teal/20 disabled:opacity-50">
                {rtl ? 'السابق' : 'Previous'}
              </button>
              <button type="submit" disabled={pending} className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-brand-teal text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-[#0d6560] focus-visible:ring-4 focus-visible:ring-brand-teal/20 disabled:cursor-not-allowed disabled:opacity-60">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? (rtl ? 'جارٍ الإنشاء...' : 'Creating...') : (rtl ? 'إنشاء مساحة العمل' : 'Create workspace')}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 flex justify-center items-center gap-2 text-xs text-ink-lighter">
          <ShieldCheck className="h-4 w-4 text-[#35a672]" />
          {rtl ? 'يمكنك تغيير هذه المعلومات لاحقاً' : 'You can change these details later'}
        </div>
      </div>
    </>
  )
}
