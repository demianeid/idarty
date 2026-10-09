/**
 * <Logo /> – full wordmark (locale-aware, theme-aware)
 * <LogoIcon /> – standalone icon mark (theme-aware)
 *
 * Theme switching is done entirely in CSS so there is no flash-of-wrong-logo
 * on initial hydration. Two <img> elements sit in the same grid cell; the
 * dark-mode one is hidden by default and revealed via the `.dark` class.
 */

import Image from 'next/image'

interface LogoProps {
  /** Current locale. Picks Arabic or English wordmark. */
  locale?: 'ar' | 'en'
  /**
   * Rendered height in px (width is kept auto / proportional).
   * Default: 32
   */
  height?: number
  className?: string
}

/**
 * Full Idarty wordmark. Automatically picks:
 * - Arabic logo when locale === 'ar', English otherwise.
 * - Black logo on light backgrounds, white logo on dark backgrounds.
 *   Switching is done with CSS (no JS) to avoid a flash on load.
 */
export function Logo({ locale = 'ar', height = 32, className = '' }: LogoProps) {
  const isAr = locale === 'ar'
  const altText = isAr ? 'إدارتي' : 'Idarty'
  const effectiveHeight = isAr ? Math.round(height * 1.15) : height

  const lightSrc = isAr
    ? '/brand/logo-ar-black.svg'
    : '/brand/logo-en-black.svg'
  const darkSrc = isAr
    ? '/brand/logo-ar-white.svg'
    : '/brand/logo-en-white.svg'

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      style={{ height: effectiveHeight }}
      aria-label={altText}
    >
      {/* Light-mode logo (visible by default, hidden in .dark) */}
      <img
        src={lightSrc}
        alt={altText}
        height={effectiveHeight}
        className="h-full w-auto object-contain dark:hidden"
      />
      {/* Dark-mode logo (hidden by default, visible in .dark) */}
      <img
        src={darkSrc}
        alt={altText}
        height={effectiveHeight}
        className="hidden h-full w-auto object-contain dark:block"
      />
    </span>
  )
}

interface LogoIconProps {
  /** Rendered height in px. Default: 32 */
  height?: number
  className?: string
}

/**
 * Standalone Idarty icon mark (the stylised "i" without the wordmark).
 * Switches between black and white with CSS dark-mode — no flash.
 */
export function LogoIcon({ height = 32, className = '' }: LogoIconProps) {
  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      style={{ height }}
      aria-label="Idarty"
    >
      <img
        src="/brand/icon-black.svg"
        alt="Idarty"
        height={height}
        className="h-full w-auto object-contain dark:hidden"
      />
      <img
        src="/brand/icon-white.svg"
        alt="Idarty"
        height={height}
        className="hidden h-full w-auto object-contain dark:block"
      />
    </span>
  )
}
