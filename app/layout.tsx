import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { IBM_Plex_Sans_Arabic, IBM_Plex_Sans } from 'next/font/google'
import { ToastProvider } from '@/components/toast'
import { isLocale, localeDirection } from '@/lib/i18n'
import './globals.css'

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

const sansFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Idarty — Workspace platform',
  description: 'A calm, secure workspace for managing tenants, bookings, and teams.',
  // Next.js auto-discovers app/icon.svg, app/favicon.ico, and app/apple-icon.png
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0B0B0F' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0F' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Resolve the document language from the request. The proxy forwards the URL's
  // locale segment as `x-idarty-locale`, so Arabic routes get lang="ar" dir="rtl"
  // and English routes get lang="en" dir="ltr" on the real <html> element.
  // Non-localized routes (/, /login, /signup, 404) fall back to the default.
  const headerList = await headers()
  const headerLocale = headerList.get('x-idarty-locale') ?? undefined
  const locale = isLocale(headerLocale) ? headerLocale : 'ar'

  return (
    <html lang={locale} dir={localeDirection(locale)}>
      <body className={`${arabicFont.variable} ${sansFont.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
