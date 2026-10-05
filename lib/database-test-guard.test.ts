import { describe, expect, it } from 'vitest'
import { getDatabaseTestUrl, getE2EDatabaseUrl } from './database-test-guard'

const good = 'postgres://user:secret@ep-test.eu-central-1.aws.neon.tech/db'

describe('database test guards', () => {
  it('requires only the dedicated migration URL and prints a credential-free host', () => {
    expect(getDatabaseTestUrl({ MIGRATION_TEST_DATABASE_URL: good, DATABASE_URL: 'postgres://main@ep-main.eu-central-1.aws.neon.tech/db' })).toEqual({ url: good, host: 'ep-test.eu-central-1.aws.neon.tech' })
    expect(() => getDatabaseTestUrl({ DATABASE_URL: good })).toThrow('MIGRATION_TEST_DATABASE_URL is required')
    expect(() => getDatabaseTestUrl({ MIGRATION_TEST_DATABASE_URL: good, DATABASE_URL: good })).toThrow('Refusing')
    expect(() => getDatabaseTestUrl({ MIGRATION_TEST_DATABASE_URL: 'postgres://u:p@ep-test.us-east-1.aws.neon.tech/db' })).toThrow('eu-central-1')
  })

  it('applies the same strict guard to E2E', () => {
    expect(getE2EDatabaseUrl({ E2E_DATABASE_URL: good, DATABASE_URL_UNPOOLED: 'postgres://main@ep-main.eu-central-1.aws.neon.tech/db' }).host).toBe('ep-test.eu-central-1.aws.neon.tech')
    expect(() => getE2EDatabaseUrl({ E2E_DATABASE_URL: good, DATABASE_URL_UNPOOLED: good })).toThrow('Refusing')
    expect(() => getE2EDatabaseUrl({ E2E_DATABASE_URL: 'postgres://u:p@ep-test.ap-southeast-1.aws.neon.tech/db' })).toThrow('eu-central-1')
  })
})
