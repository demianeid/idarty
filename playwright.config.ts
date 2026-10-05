import { defineConfig, devices } from '@playwright/test'

const databaseUrl = process.env.DATABASE_URL
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
if (!e2eDatabaseUrl) throw new Error('E2E_DATABASE_URL is required for Playwright tests')
if (databaseUrl && e2eDatabaseUrl === databaseUrl) throw new Error('Refusing to run E2E tests against DATABASE_URL')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium-ar', use: { ...devices['Desktop Chrome'], locale: 'ar' } },
    { name: 'chromium-en', use: { ...devices['Desktop Chrome'], locale: 'en-US' } },
  ],
})
