'use server'

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { websiteConfig, tenants } from '@/lib/db/schema'
import { requireTenantAccess } from '@/lib/authz'
import { logAudit } from '@/lib/audit'
import { parseWebsiteConfig, safeParseWebsiteConfig, createDefaultWebsiteConfig } from '@/lib/website-config'
import type { Locale } from '@/lib/i18n'

// ---------------------------------------------------------------------------
// Save Draft
// Updates the tenant's draft configuration with validated input.
// ---------------------------------------------------------------------------

export async function saveDraft(input: { slug: string; locale: Locale; config: unknown }) {
  const access = await requireTenantAccess(await headers(), input.slug, 'manager')

  const validated = parseWebsiteConfig(input.config)

  await db
    .insert(websiteConfig)
    .values({
      tenantId: access.tenant.id,
      draft: validated as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: websiteConfig.tenantId,
      set: {
        draft: validated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    })

  await logAudit({
    actorUserId: access.session.user.id,
    action: 'website.draft.saved',
    entityType: 'website_config',
    entityId: access.tenant.id,
    tenantId: access.tenant.id,
    metadata: { slug: input.slug, sectionsCount: validated.sections.length },
  })

  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)

  return { ok: true as const }
}

// ---------------------------------------------------------------------------
// Publish Changes
// If config is provided, validates and publishes it directly (atomic save+draft+publish).
// If config is omitted, reads the persisted draft and publishes that.
// ---------------------------------------------------------------------------

export async function publishChanges(input: { slug: string; locale: Locale; config?: unknown }) {
  const access = await requireTenantAccess(await headers(), input.slug, 'admin')

  let validated: ReturnType<typeof parseWebsiteConfig>

  if (input.config !== undefined) {
    // Direct publish: validate the submitted config
    validated = parseWebsiteConfig(input.config)
  } else {
    // Publish saved draft: read from database
    const row = await db.query.websiteConfig.findFirst({
      where: eq(websiteConfig.tenantId, access.tenant.id),
    })

    if (!row) {
      return { ok: false as const, error: 'NO_DRAFT' }
    }

    validated = parseWebsiteConfig(row.draft)
  }

  // Atomically update both draft and published in a single transaction
  await db.transaction(async (tx) => {
    await tx
      .update(websiteConfig)
      .set({
        draft: validated as unknown as Record<string, unknown>,
        published: validated as unknown as Record<string, unknown>,
        publishedAt: new Date(),
        publishedBy: access.session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(websiteConfig.tenantId, access.tenant.id))
  })

  await logAudit({
    actorUserId: access.session.user.id,
    action: 'website.published',
    entityType: 'website_config',
    entityId: access.tenant.id,
    tenantId: access.tenant.id,
    metadata: { slug: input.slug, sectionsCount: validated.sections.length, directPublish: input.config !== undefined },
  })

  revalidatePath(`/${input.locale}/tenants/${input.slug}`)
  revalidateTag(`tenant-public-${input.slug}-${input.locale}`, 'max')

  return { ok: true as const }
}

// ---------------------------------------------------------------------------
// Discard Draft
// Resets the draft to the last published configuration.
// If no published config exists, resets to a valid default configuration so the
// editor never ends up with an unrecoverable, section-less draft.
// Returns the configuration the draft was reset to, so the client can sync its
// local editor state without relying on a stale server-rendered prop.
// ---------------------------------------------------------------------------

export async function discardDraft(input: { slug: string; locale: Locale }) {
  const access = await requireTenantAccess(await headers(), input.slug, 'admin')

  const row = await db.query.websiteConfig.findFirst({
    where: eq(websiteConfig.tenantId, access.tenant.id),
  })

  // If no row exists, nothing to discard
  if (!row) {
    return { ok: true as const, message: 'NO_CONFIG', config: null }
  }

  // Reset draft to the last published config. When the tenant has never
  // published, fall back to a valid default config (NOT `{}`, which would
  // parse to zero sections and leave the editor with no controls at all).
  const resetValue: Record<string, unknown> =
    (row.published as Record<string, unknown> | null) ??
    (createDefaultWebsiteConfig() as unknown as Record<string, unknown>)

  await db
    .update(websiteConfig)
    .set({
      draft: resetValue,
      updatedAt: new Date(),
    })
    .where(eq(websiteConfig.tenantId, access.tenant.id))

  await logAudit({
    actorUserId: access.session.user.id,
    action: 'website.draft.discarded',
    entityType: 'website_config',
    entityId: access.tenant.id,
    tenantId: access.tenant.id,
    metadata: { slug: input.slug, hadPublished: row.published !== null },
  })

  revalidatePath(`/${input.locale}/tenants/${input.slug}/dashboard`)

  return { ok: true as const, config: safeParseWebsiteConfig(resetValue) }
}
