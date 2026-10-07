import 'server-only'

import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

/**
 * Audit logging helper — writes to the audit_logs table.
 *
 * NEVER store passwords, tokens, secrets, or sensitive credentials in metadata.
 * Metadata should contain only non-sensitive context (e.g., { reason: 'user_request' }).
 */

export interface AuditEntry {
  actorUserId?: string
  action: string
  entityType: string
  entityId?: string
  tenantId?: string
  metadata?: Record<string, unknown>
}

/**
 * Write an audit log entry.
 * Extracts IP address and User-Agent from the provided Headers object.
 * Silently catches errors to avoid breaking the calling flow.
 */
export async function logAudit(entry: AuditEntry, headers?: Headers) {
  try {
    const ipAddress = headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = headers?.get('user-agent') ?? null

    await db.insert(auditLogs).values({
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      tenantId: entry.tenantId ?? null,
      metadata: entry.metadata ?? {},
      ipAddress,
      userAgent,
    })
  } catch (error) {
    // Audit logging should never break the primary flow
    console.error('[audit] Failed to write audit log', {
      action: entry.action,
      entityType: entry.entityType,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    // Report to Sentry if available (never expose secrets/tokens in the error)
    try {
      const Sentry = require('@sentry/nextjs')
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(error, {
          tags: { component: 'audit' },
          extra: { action: entry.action, entityType: entry.entityType },
        })
      }
    } catch {
      // Sentry not available — console.error above is the fallback
    }
  }
}
