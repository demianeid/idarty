import { defineConfig, devices } from '@playwright/test'
import { getE2EDatabaseUrl } from './lib/database-test-guard'

getE2EDatabaseUrl()

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
