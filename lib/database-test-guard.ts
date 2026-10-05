function endpointId(url: string | undefined) {
  if (!url) return null
  const host = new URL(url).hostname
  const match = host.match(/(ep-[a-z0-9-]+?)(?:-pooler)?(?:\.|$)/i)
  return match?.[1]?.replace(/-pooler$/, '') ?? null
}

function assertSafeTestUrl(url: string | undefined, env: Record<string, string | undefined>, variable: string) {
  if (!url) throw new Error(`${variable} is required`)
  if (url === env.DATABASE_URL || url === env.DATABASE_URL_UNPOOLED) throw new Error(`Refusing to use DATABASE_URL or DATABASE_URL_UNPOOLED for ${variable}`)
  const testId = endpointId(url)
  if (!testId) throw new Error(`${variable} must contain a Neon endpoint ID`)
  if (testId === endpointId(env.DATABASE_URL) || testId === endpointId(env.DATABASE_URL_UNPOOLED)) throw new Error(`${variable} endpoint matches the main database endpoint`)
  const parsed = new URL(url)
  if (!parsed.hostname.includes('eu-central-1')) throw new Error(`${variable} host must include eu-central-1`)
  return { url, host: parsed.hostname, endpointId: testId }
}

export function getDatabaseTestUrl(env: Record<string, string | undefined> = process.env) {
  return assertSafeTestUrl(env.MIGRATION_TEST_DATABASE_URL, env, 'MIGRATION_TEST_DATABASE_URL')
}

export function getE2EDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  return assertSafeTestUrl(env.E2E_DATABASE_URL, env, 'E2E_DATABASE_URL')
}
