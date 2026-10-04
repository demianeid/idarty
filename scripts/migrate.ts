import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from 'dotenv'
import { Client } from 'pg'

config({ path: ['.env.local', '.env.development.local', '.env'], quiet: true })

// Migrations run over the direct (unpooled) connection: DDL and session-level
// locks are not safe through PgBouncer's transaction pooling.
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL_UNPOOLED (or DATABASE_URL) is required')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations')

async function main() {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`)
    // Serialize concurrent runs (e.g. two deploys) on a fixed advisory lock.
    await client.query('SELECT pg_advisory_lock(727001)')

    const applied = new Map<string, string>(
      (await client.query<{ name: string; checksum: string }>('SELECT name, checksum FROM schema_migrations'))
        .rows.map((r) => [r.name, r.checksum]),
    )
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()

    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')
      const previous = applied.get(file)
      if (previous) {
        if (previous !== checksum) {
          throw new Error(`Migration ${file} was modified after being applied. Create a new migration instead.`)
        }
        continue
      }
      process.stdout.write(`Applying ${file} ... `)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [file, checksum])
        await client.query('COMMIT')
        console.log('done')
      } catch (error) {
        await client.query('ROLLBACK')
        console.log('failed')
        throw error
      }
    }
    console.log('Migrations up to date.')
  } finally {
    await client.query('SELECT pg_advisory_unlock(727001)').catch(() => {})
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
