import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// DATABASE_URL is Neon's pooled (PgBouncer) endpoint — used for all app traffic.
// Migrations use DATABASE_URL_UNPOOLED (see scripts/migrate.ts).
const globalForDb = globalThis as unknown as { pgPool?: Pool }

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool

export const db = drizzle(pool, { schema })
export type Db = typeof db
