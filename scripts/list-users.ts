import { config } from 'dotenv'
import { Pool } from 'pg'

config({ path: ['.env.local', '.env.development.local', '.env'] })

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const result = await pool.query('SELECT email, name, "isPlatformAdmin" FROM "user" ORDER BY "createdAt" LIMIT 20')
  console.log('\nUsers in database:')
  console.table(result.rows)
  await pool.end()
}

main().catch(console.error)
