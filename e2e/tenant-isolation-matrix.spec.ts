import { test, expect } from '@playwright/test'

test.describe('Tenant Isolation Matrix', () => {
  test.skip(!process.env.E2E_DATABASE_URL, 'Requires E2E_DATABASE_URL')

  test('Tenant B member cannot view Tenant A dashboard', async ({ page }) => {
    // Log in as Tenant B member
    await page.goto('/en/login')
    await page.getByLabel('Email').fill('e2e+tenant-b@example.test')
    await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD ?? '')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/en\/dashboard/)

    // Try to access Tenant A dashboard
    const response = await page.goto('/en/tenants/tenant-a/dashboard')
    
    // We expect the app to redirect us back to login or dashboard due to unauthorized access, or return a 404/403
    await expect(page).toHaveURL(/\/en\/(login|dashboard)$/)
  })

  test('Tenant B member cannot access Tenant A calendar', async ({ page }) => {
    await page.goto('/en/login')
    await page.getByLabel('Email').fill('e2e+tenant-b@example.test')
    await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD ?? '')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/en\/dashboard/)

    await page.goto('/en/tenants/tenant-a/calendar')
    await expect(page).toHaveURL(/\/en\/(login|dashboard)$/)
  })
})
