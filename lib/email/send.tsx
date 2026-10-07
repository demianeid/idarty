import 'server-only'

import { render } from '@react-email/render'
import { BookingCancellationEmail, BookingConfirmationEmail, BookingReminderEmail, emailSubjects, ResetPasswordEmail, VerifyEmailEmail, type EmailLocale, type EmailTemplate } from './templates'

async function getTransporter() {
  const user = process.env.GMAIL_SMTP_USER
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD
  if (!user || !pass) return null
  const { default: nodemailer } = await import('nodemailer')
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
}

function fromAddress() {
  const user = process.env.GMAIL_SMTP_USER
  return user ? `IDARTY <${user}>` : 'IDARTY <noreply@idarty.com>'
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
  const transporter = await getTransporter()
  if (!transporter) {
    console.error('[idarty] GMAIL_SMTP_USER or GMAIL_SMTP_APP_PASSWORD is not configured')
    throw new Error('EMAIL_NOT_CONFIGURED')
  }
  try {
    const info = await transporter.sendMail({
      from: fromAddress(),
      to: input.to,
      subject: emailSubjects[locale][input.template],
      html,
    })
    return info
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[email] Gmail SMTP failed', { message, template: input.template })
    throw new Error('EMAIL_DELIVERY_FAILED')
  }
}
