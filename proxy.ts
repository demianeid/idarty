import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, getLocaleFromHeader } from './lib/i18n'
import { pool } from './lib/db'

const crawlerPattern = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|twitterbot/i

async function isAllowed(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  try {
    const result = await pool.query<{ count: number }>(
      `INSERT INTO rate_limits (key, count, window_started_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE
         SET count = CASE
               WHEN rate_limits.window_started_at = $2 THEN rate_limits.count + 1
               ELSE 1
             END,
             window_started_at = CASE
               WHEN rate_limits.window_started_at = $2 THEN rate_limits.window_started_at
               ELSE $2
             END
       RETURNING count`,
      [key, windowStart],
    )
    return (result.rows[0]?.count ?? 1) <= limit
  } catch (error) {
    // Fail closed: if the rate-limit check fails, deny the request.
    console.error('[proxy] rate-limit check failed', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Auth rate limiting ──────────────────────────────────────────────────────
  // POST /api/auth/sign-in/email → max 10 attempts per IP per 15 minutes
  if (request.method === 'POST' && pathname === '/api/auth/sign-in/email') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const allowed = await isAllowed(`auth:signin:${ip}`, 10, 15 * 60_000)
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many sign-in attempts. Please wait 15 minutes.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '900' } },
      )
    }
  }

  // ── Locale & routing ────────────────────────────────────────────────────────
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
  const pathLocale = pathname.split('/')[1] || defaultLocale
  // Forward the locale to the app on the REQUEST so the root layout can set the
  // document-level <html lang> and dir correctly for both Arabic and English.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-idarty-locale', pathLocale)
  const localized = NextResponse.next({ request: { headers: requestHeaders } })
  localized.headers.set('x-idarty-locale', pathLocale)
  return localized
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }

