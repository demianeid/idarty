import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, getLocaleFromHeader } from './lib/i18n'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next()
  if (pathname === '/') {
    const locale = getLocaleFromHeader(request.headers.get('accept-language')) || defaultLocale
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    return NextResponse.redirect(url)
  }
  const response = NextResponse.next()
  response.headers.set('x-idarty-locale', pathname.split('/')[1] || defaultLocale)
  return response
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
