/**
 * Backfill script: creates default website_config rows for existing tenants.
 *
 * This script is idempotent — it only creates rows for tenants that don't
 * already have a website_config record. It never overwrites existing
 * draft or published configurations.
 *
 * Usage:
 *   pnpm exec tsx scripts/backfill-website-config.ts
 *   MIGRATION_TEST_MODE=true pnpm exec tsx scripts/backfill-website-config.ts  (uses test DB)
 */
import { config } from 'dotenv'
import { Pool } from 'pg'
import { createDefaultWebsiteConfig } from '../lib/website-config'

config({ path: ['.env.local', '.env.development.local', '.env'], quiet: true })

const testMode = process.env.MIGRATION_TEST_MODE === 'true'

// In test mode, use the test database URL; otherwise use the unpooled connection
const connectionString = testMode
  ? process.env.MIGRATION_TEST_DATABASE_URL
  : process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error(
    testMode
      ? 'MIGRATION_TEST_DATABASE_URL is required when MIGRATION_TEST_MODE=true'
      : 'DATABASE_URL_UNPOOLED (or DATABASE_URL) is required'
  )
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString })
  try {
    const client = await pool.connect()
    try {
      // Fetch all tenants that don't have a website_config row
      const { rows: tenants } = await client.query<{
        id: string
        slug: string
        theme: Record<string, string>
      }>(`
        SELECT t.id, t.slug, t.theme
        FROM tenants t
        LEFT JOIN website_config wc ON wc.tenant_id = t.id
        WHERE wc.tenant_id IS NULL
          AND t.deleted_at IS NULL
        ORDER BY t.created_at ASC
      `)

      if (tenants.length === 0) {
        console.log('No tenants need backfill. All tenants have website_config rows.')
        return
      }

      console.log(`Backfilling ${tenants.length} tenant(s)...`)

      const defaultConfig = createDefaultWebsiteConfig()

      for (const tenant of tenants) {
        // Merge existing theme into the default config's theme override
        const theme = tenant.theme ?? {}
        const configWithTheme = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            ...(theme.primaryColor && { primaryColor: theme.primaryColor }),
            ...(theme.accentColor && { accentColor: theme.accentColor }),
            ...(theme.logo && { logo: theme.logo }),
          },
        }

        await client.query(
          `INSERT INTO website_config (tenant_id, draft, published, published_at, published_by, updated_at)
           VALUES ($1, $2, $3, now(), NULL, now())
           ON CONFLICT (tenant_id) DO NOTHING`,
          [
            tenant.id,
            JSON.stringify(configWithTheme),
            JSON.stringify(configWithTheme), // published = draft for existing tenants
          ]
        )

        console.log(`  ✓ ${tenant.slug} (${tenant.id})`)
      }

      console.log(`\nBackfill complete. ${tenants.length} tenant(s) processed.`)
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
