import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, getLocaleFromHeader } from './lib/i18n'

const crawlerPattern = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|twitterbot/i

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next()
  if (pathname === '/') {
    const userAgent = request.headers.get('user-agent') ?? ''
    const locale = crawlerPattern.test(userAgent) ? defaultLocale : request.cookies.get('idarty_locale')?.value === 'en' ? 'en' : request.cookies.get('idarty_locale')?.value === 'ar' ? 'ar' : getLocaleFromHeader(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    const response = NextResponse.redirect(url)
    response.cookies.set('idarty_locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return response
  }
  const response = NextResponse.next()
  response.headers.set('x-idarty-locale', pathname.split('/')[1] || defaultLocale)
  return response
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
