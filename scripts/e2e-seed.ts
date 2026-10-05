import 'dotenv/config'
import { Client } from 'pg'

const url = process.env.E2E_DATABASE_URL
if (!url) throw new Error('E2E_DATABASE_URL is required')
if (url === process.env.DATABASE_URL) throw new Error('Refusing to seed DATABASE_URL')
async function main() {
  const client = new Client({ connectionString: url })
  await client.connect()
  await client.query('SELECT 1')
  await client.end()
  console.log('E2E database connection verified')
}

void main()
