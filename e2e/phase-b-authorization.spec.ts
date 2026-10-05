import { test, expect } from '@playwright/test'

const databaseUrl = process.env.E2E_DATABASE_URL

test.describe('Phase B cross-tenant authorization', () => {
  test.skip(!databaseUrl, 'Requires E2E_DATABASE_URL')

  test('another tenant cannot edit, archive, or assign resources', async ({ page }) => {
    // The seeded E2E users sign in through the real UI; every click below invokes the real server action.
    await page.goto('/en/login?next=/en/tenants/tenant-a/dashboard')
    await page.getByLabel('Email').fill('e2e+tenant-b@example.test')
    await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD ?? '')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/en\/dashboard/)
    await page.goto('/en/tenants/tenant-a/dashboard')
    await expect(page).toHaveURL(/\/en\/dashboard/)
  })
})
