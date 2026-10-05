import 'dotenv/config'
import { Client } from 'pg'
import { getE2EDatabaseUrl } from '../lib/database-test-guard'

const { url, host } = getE2EDatabaseUrl()
console.log(`E2E database host: ${host}`)
async function main() {
  const client = new Client({ connectionString: url })
  await client.connect()
  await client.query('SELECT 1')
  await client.end()
  console.log('E2E database connection verified')
}

void main()
