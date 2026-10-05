import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { sendTransactionalEmail } from '@/lib/email/send'

const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true'
const productionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
if (skipEmailVerification && productionRuntime) throw new Error('SKIP_EMAIL_VERIFICATION cannot be enabled in production')

const runtimeOrigins = [
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  process.env.V0_BUILD_URL,
  process.env.V0_SANDBOX_URL,
].filter((value): value is string => Boolean(value))

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  process.env.V0_RUNTIME_URL ||
  'http://localhost:3000'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: baseURL.startsWith('http') ? baseURL : `https://${baseURL}`,
  trustedOrigins: [
    'http://localhost:3000',
    ...runtimeOrigins,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !skipEmailVerification,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        template: 'reset',
        url,
        locale: 'ar',
        idempotencyKey: `reset-password/${user.id}`,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        template: 'verify',
        url,
        locale: 'ar',
        idempotencyKey: `verify-email/${user.id}`,
      })
    },
  },
  user: {
    additionalFields: {
      preferredLocale: { type: 'string', required: false, defaultValue: 'ar' },
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})

export type Session = typeof auth.$Infer.Session

export async function getSession(requestHeaders: Headers) {
  return auth.api.getSession({ headers: requestHeaders })
}

export async function requireSession(requestHeaders: Headers) {
  const session = await getSession(requestHeaders)
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

export function publicOrigin() {
  return baseURL.startsWith('http') ? baseURL : `https://${baseURL}`
}

export default auth
