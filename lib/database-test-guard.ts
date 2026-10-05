export function getDatabaseTestUrl(env: Record<string, string | undefined> = process.env) {
  const url = env.MIGRATION_TEST_DATABASE_URL
  if (!url) throw new Error('MIGRATION_TEST_DATABASE_URL is required')
  if (url === env.DATABASE_URL || url === env.DATABASE_URL_UNPOOLED) throw new Error('Refusing to use DATABASE_URL or DATABASE_URL_UNPOOLED')
  const parsed = new URL(url)
  if (!parsed.hostname.includes('eu-central-1')) throw new Error('MIGRATION_TEST_DATABASE_URL host must include eu-central-1')
  return { url, host: parsed.hostname }
}

export function getE2EDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const url = env.E2E_DATABASE_URL
  if (!url) throw new Error('E2E_DATABASE_URL is required')
  if (url === env.DATABASE_URL || url === env.DATABASE_URL_UNPOOLED) throw new Error('Refusing to use DATABASE_URL or DATABASE_URL_UNPOOLED')
  const parsed = new URL(url)
  if (!parsed.hostname.includes('eu-central-1')) throw new Error('E2E_DATABASE_URL host must include eu-central-1')
  return { url, host: parsed.hostname }
}
