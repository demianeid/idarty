import 'server-only'

import { render } from '@react-email/render'
import { Resend } from 'resend'
import { BookingCancellationEmail, BookingConfirmationEmail, BookingReminderEmail, emailSubjects, ResetPasswordEmail, VerifyEmailEmail, type EmailLocale, type EmailTemplate } from './templates'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

function fromAddress() {
  const domain = process.env.RESEND_EMAIL_DOMAIN || 'idarty.com'
  return `idarty <hello@${domain}>`
}

export async function sendTransactionalEmail(input: {
  to: string
  locale?: EmailLocale
  template: EmailTemplate
  url: string
  idempotencyKey: string
  startsAt?: string
}) {
  const locale = input.locale || 'ar'
  const element = input.template === 'verify'
    ? <VerifyEmailEmail locale={locale} url={input.url} />
    : input.template === 'booking'
      ? <BookingConfirmationEmail locale={locale} url={input.url} startsAt={input.startsAt ?? new Date().toISOString()} />
      : input.template === 'cancellation'
        ? <BookingCancellationEmail locale={locale} url={input.url} startsAt={input.startsAt ?? new Date().toISOString()} />
        : input.template === 'reminder'
          ? <BookingReminderEmail locale={locale} url={input.url} startsAt={input.startsAt ?? new Date().toISOString()} />
          : <ResetPasswordEmail locale={locale} url={input.url} />
  const html = await render(element)
  const resend = getResend()
  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [DEV EMAIL] To: ${input.to}`)
      console.log(`📧 [DEV EMAIL] Template: ${input.template}`)
      console.log(`📧 [DEV EMAIL] URL: ${input.url}\n`)
      return { id: 'dev-email-mock' }
    }
    console.error('[idarty] RESEND_API_KEY is not configured')
    throw new Error('EMAIL_NOT_CONFIGURED')
  }
  const { data, error } = await resend.emails.send(
    { from: fromAddress(), to: [input.to], subject: emailSubjects[locale][input.template], html },
    { idempotencyKey: input.idempotencyKey },
  )
  if (error) {
    console.error('[email] Resend failed', { message: error.message, template: input.template })
    throw new Error('EMAIL_DELIVERY_FAILED')
  }
  return data
}
