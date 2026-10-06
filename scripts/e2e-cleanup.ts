import 'dotenv/config'
import { Client } from 'pg'
import { getE2EDatabaseUrl } from '../lib/database-test-guard'

const { url } = getE2EDatabaseUrl()

async function main() {
  const client = new Client({ connectionString: url })
  await client.connect()
  await client.query(`DELETE FROM "user" WHERE email LIKE 'e2e+%@example.test'`)
  await client.end()
  console.log('E2E data cleaned')
}

void main().catch((error) => { console.error(error); process.exitCode = 1 })
