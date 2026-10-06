/**
 * Sets a new password for any user by email.
 * Usage: npx tsx scripts/set-password.ts <email> <new_password>
 */
import { config } from 'dotenv'
import { Client } from 'pg'
import { hashPassword } from 'better-auth/crypto'

config({ path: ['.env.local', '.env.development.local', '.env'], quiet: true })

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const [, , EMAIL, PLAIN_PASSWORD] = process.argv
if (!EMAIL || !PLAIN_PASSWORD) {
  console.error('Usage: npx tsx scripts/set-password.ts <email> <new_password>')
  process.exit(1)
}

async function main() {
  const hashed = await hashPassword(PLAIN_PASSWORD)
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const { rows } = await client.query<{ id: string }>('SELECT id FROM "user" WHERE email = $1', [EMAIL])
    if (!rows[0]) {
      console.error(`❌ User ${EMAIL} not found.`)
      process.exit(1)
    }
    const userId = rows[0].id
    const { rows: existing } = await client.query<{ id: string }>(
      `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId]
    )
    if (existing[0]) {
      await client.query(
        `UPDATE account SET "accountId" = $1, password = $2, "updatedAt" = now() WHERE id = $3`,
        [userId, hashed, existing[0].id]
      )
    } else {
      await client.query(`
        INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, 'credential', $1, $2, now(), now())
      `, [userId, hashed])
    }
    console.log(`\n✅ Password updated!`)
    console.log(`   Email:    ${EMAIL}`)
    console.log(`   Password: ${PLAIN_PASSWORD}`)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
