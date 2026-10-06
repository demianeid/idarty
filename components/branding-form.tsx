'use client'

import { useState, useTransition } from 'react'
import { saveBrandingColors } from '@/app/[locale]/tenants/[slug]/dashboard/branding-actions'
import type { Locale } from '@/lib/i18n'
import { useToast } from '@/components/toast'

const PRESET_COLORS = [
  { label: 'idarty Blue', primary: '#0F766E', accent: '#f0faf9' },
  { label: 'Emerald',     primary: '#059669', accent: '#d1fae5' },
  { label: 'Violet',      primary: '#7c3aed', accent: '#ede9fe' },
  { label: 'Rose',        primary: '#e11d48', accent: '#ffe4e6' },
  { label: 'Amber',       primary: '#d97706', accent: '#fef3c7' },
  { label: 'Slate',       primary: '#475569', accent: '#f1f5f9' },
]

export function BrandingForm({
  locale,
  slug,
  currentPrimary = '#0F766E',
  currentAccent = '#f0faf9',
  currentLogo = '',
}: {
  locale: Locale
  slug: string
  currentPrimary?: string
  currentAccent?: string
  currentLogo?: string
}) {
  const rtl = locale === 'ar'
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [primary, setPrimary] = useState(currentPrimary)
  const [accent, setAccent] = useState(currentAccent)
  const [logo, setLogo] = useState(currentLogo)
  const [message, setMessage] = useState('')

  function applyPreset(p: string, a: string) {
    setPrimary(p)
    setAccent(a)
    setMessage('')
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        // In a real app we'd resize this via canvas, but for demo we just store base64 directly
        setLogo(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    setMessage('')
    startTransition(async () => {
      const result = await saveBrandingColors({ slug, locale, primaryColor: primary, accentColor: accent, logoBase64: logo })
      const msg = result.ok
        ? (rtl ? '✓ تم حفظ الهوية البصرية' : '✓ Branding saved')
        : (result.message ?? (rtl ? 'تعذر الحفظ' : 'Could not save'))
      setMessage(msg)
      toast(result.ok ? 'success' : 'error', msg)
    })
  }

  return (
    <div className="mt-5 space-y-6">
      {/* Logo upload */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-[#647087]">{rtl ? 'شعار مساحة العمل' : 'Workspace logo'}</span>
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e1e5ed] bg-surface">
            {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-ink-lighter">id</span>}
          </div>
          <div>
            <label className="cursor-pointer rounded-lg border border-[#e1e5ed] bg-paper px-3 py-1.5 text-xs font-semibold text-[#516078] transition hover:bg-surface">
              {rtl ? 'اختر صورة' : 'Choose image'}
              <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} className="hidden" />
            </label>
            <p className="mt-2 text-xs text-ink-lighter">{rtl ? 'ينصح بصورة مربعة (الحد الأقصى 1 ميجابايت)' : 'Square image recommended (Max 1MB)'}</p>
          </div>
        </div>
      </div>

      {/* Live preview swatch */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <span className="h-10 w-10 shrink-0 rounded-xl shadow-sm" style={{ background: primary }} />
        <span className="h-10 w-10 shrink-0 rounded-xl border border-[#e1e5ed] shadow-sm" style={{ background: accent }} />
        <div>
          <p className="text-sm font-semibold">{rtl ? 'معاينة الألوان' : 'Color preview'}</p>
          <p className="mt-0.5 text-xs text-ink-lighter">{primary} · {accent}</p>
        </div>
        <a
          href={`/${locale}/tenants/${slug}`}
          target="_blank"
          className="ms-auto rounded-lg border border-[#e1e5ed] bg-paper px-3 py-1.5 text-xs font-semibold text-[#516078] shadow-sm transition hover:bg-surface"
        >
          {rtl ? 'معاينة الصفحة' : 'Preview page'}
        </a>
      </div>

      {/* Preset swatches */}
      <div>
        <p className="mb-2 text-xs font-semibold text-ink-lighter">{rtl ? 'ألوان جاهزة' : 'Preset palettes'}</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.primary}
              type="button"
              title={preset.label}
              onClick={() => applyPreset(preset.primary, preset.accent)}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl shadow-sm transition hover:scale-110 ${primary === preset.primary ? 'ring-2 ring-offset-2 ring-brand-teal' : ''}`}
              style={{ background: preset.primary }}
            />
          ))}
        </div>
      </div>

      {/* Custom color inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-[#647087]">{rtl ? 'اللون الأساسي' : 'Primary color'}</span>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e1e5ed] bg-paper px-3 py-2">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
            <span className="font-mono text-sm text-[#374151]">{primary}</span>
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#647087]">{rtl ? 'اللون الثانوي' : 'Accent color'}</span>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e1e5ed] bg-paper px-3 py-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
            <span className="font-mono text-sm text-[#374151]">{accent}</span>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d6560] disabled:opacity-60"
        >
          {pending ? (rtl ? 'جارٍ الحفظ...' : 'Saving...') : (rtl ? 'حفظ التعديلات' : 'Save branding')}
        </button>
        {message && <p className="text-sm font-medium text-brand-teal">{message}</p>}
      </div>
    </div>
  )
}
