/**
 * Sets a password for owner@idarty.com using better-auth's own hashPassword.
 * Run: npx tsx scripts/set-seed-password.ts
 */
import { config } from 'dotenv'
import { Client } from 'pg'
import { hashPassword } from 'better-auth/crypto'

config({ path: ['.env.local', '.env.development.local', '.env'], quiet: true })

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const EMAIL = 'owner@idarty.com'
const PLAIN_PASSWORD = 'Admin1234!'

async function main() {
  const hashed = await hashPassword(PLAIN_PASSWORD)
  console.log('Password hashed ✓')

  const client = new Client({ connectionString })
  await client.connect()
  try {
    const { rows } = await client.query<{ id: string }>('SELECT id FROM "user" WHERE email = $1', [EMAIL])
    if (!rows[0]) {
      console.error(`User ${EMAIL} not found. Run: npm run db:seed first.`)
      process.exit(1)
    }
    const userId = rows[0].id

    // Check if a credential account already exists for this user
    const { rows: existing } = await client.query<{ id: string }>(
      `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId]
    )

    if (existing[0]) {
      // Update the existing row — fix accountId too in case it was wrong before
      await client.query(
        `UPDATE account SET "accountId" = $1, password = $2, "updatedAt" = now() WHERE id = $3`,
        [userId, hashed, existing[0].id]
      )
    } else {
      // Insert a new credential row — accountId must be the userId for better-auth's credential provider
      await client.query(`
        INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, 'credential', $1, $2, now(), now())
      `, [userId, hashed])
    }

    console.log(`\n✅ Done! Log in with:`)
    console.log(`   Email:    ${EMAIL}`)
    console.log(`   Password: ${PLAIN_PASSWORD}`)
    console.log(`   URL:      http://localhost:3000/login`)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
