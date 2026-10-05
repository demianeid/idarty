import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { memberships, tenants } from '@/lib/db/schema'
import { isLocale, type Locale } from '@/lib/i18n'

export default async function DashboardResolver({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const session = await requireSession(await headers())
  const membershipsForUser = await db.select({ slug: tenants.slug }).from(memberships).innerJoin(tenants, eq(memberships.tenantId, tenants.id)).where(eq(memberships.userId, session.user.id)).orderBy(desc(memberships.createdAt)).limit(1)
  if (!membershipsForUser[0]) redirect(`/${locale}/onboarding`)
  redirect(`/${locale}/tenants/${membershipsForUser[0].slug}/dashboard`)
}
