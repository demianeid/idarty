import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { serviceTranslations, services, tenantTranslations, tenants, workingHours, websiteConfig } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'
import { safeParseWebsiteConfig } from '@/lib/website-config'
import { shouldShowPublicWorkingHour } from '@/lib/public-hours-policy'
import { TenantWebsite } from '@/components/tenant-website'
import type { Locale } from '@/lib/i18n'

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  const rtl = locale === 'ar'

  // Authorization: require manager (or higher) role to preview drafts.
  // Anonymous visitors and unauthorized users are redirected to sign-in rather
  // than shown a raw error page — and never receive any draft data.
  let access
  try {
    access = await requireTenantAccess(await headers(), slug, 'manager')
  } catch {
    redirect(`/${locale}/login`)
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, access.tenant.id),
  })

  if (!tenant) notFound()

  // Fetch the DRAFT configuration (not the published one)
  const configRow = await db.query.websiteConfig.findFirst({
    where: eq(websiteConfig.tenantId, access.tenant.id),
  })

  const draftConfig = configRow ? safeParseWebsiteConfig(configRow.draft) : null

  // Fetch live data (same as public page)
  const [translation, serviceRows, rawHoursRows] = await Promise.all([
    db.query.tenantTranslations.findFirst({
      where: and(eq(tenantTranslations.tenantId, tenant.id), eq(tenantTranslations.locale, locale)),
    }),
    db.select({
      id: services.id,
      name: serviceTranslations.name,
      description: serviceTranslations.description,
      durationMin: services.durationMin,
      priceAmount: services.priceAmount,
    })
      .from(services)
      .leftJoin(
        serviceTranslations,
        and(eq(serviceTranslations.serviceId, services.id), eq(serviceTranslations.locale, locale))
      )
      .where(
        and(
          eq(services.tenantId, tenant.id),
          eq(services.isActive, true),
          eq(services.isSample, false),
          isNull(services.deletedAt)
        )
      )
      .orderBy(services.sortOrder),
    db.select({
      weekday: workingHours.weekday,
      startTime: workingHours.startTime,
      endTime: workingHours.endTime,
      isSample: workingHours.isSample,
    })
      .from(workingHours)
      .where(and(eq(workingHours.tenantId, tenant.id), isNull(workingHours.staffId)))
      .orderBy(workingHours.weekday),
  ])

  const hoursRows = rawHoursRows.filter((hour) => shouldShowPublicWorkingHour(hour.isSample))

  return (
    <TenantWebsite
      locale={locale}
      slug={slug}
      previewBanner={
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-800 shadow-sm">
          {rtl ? 'معاينة المسودة — هذه الصفحة غير عامة' : 'Draft Preview — This page is not public'}
        </div>
      }
      tenant={{
        currency: tenant.currency,
        email: tenant.email,
        phoneE164: tenant.phoneE164,
        theme: tenant.theme as Record<string, string> | null,
      }}
      translation={translation ? {
        name: translation.name,
        tagline: translation.tagline,
        description: translation.description,
        address: translation.address,
      } : null}
      serviceRows={serviceRows.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        priceAmount: String(s.priceAmount),
      }))}
      hoursRows={hoursRows.map((h) => ({
        weekday: h.weekday,
        startTime: h.startTime,
        endTime: h.endTime,
      }))}
      config={draftConfig}
    />
  )
}
