import { config } from 'dotenv'
import { Pool } from 'pg'

config({ path: ['.env.local', '.env.development.local', '.env'] })

const email = process.argv[2]
if (!email) {
  console.error('Usage: tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  const result = await pool.query(`UPDATE "user" SET "isPlatformAdmin" = true WHERE email = $1 RETURNING *`, [email])
  
  if (result.rowCount === 0) {
    console.log(`❌ User with email ${email} not found.`)
  } else {
    console.log(`✅ Success! ${email} is now a platform admin.`)
  }
  
  await pool.end()
}

main().catch(console.error)
