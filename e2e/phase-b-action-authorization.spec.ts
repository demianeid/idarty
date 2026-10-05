import { test, expect } from '@playwright/test'

test.describe('real Phase B action authorization', () => {
  test.skip(!process.env.E2E_DATABASE_URL, 'Requires E2E_DATABASE_URL')

  test('tenant B cannot invoke tenant A service, staff, or assignment actions', async ({ page }) => {
    await page.goto('/en/login?next=/en/tenants/tenant-a/dashboard')
    await page.getByLabel('Email').fill('e2e+tenant-b@example.test')
    await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD ?? '')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/en\/dashboard/)

    const response = await page.request.post('/en/tenants/tenant-a/dashboard/actions', {
      data: { serviceId: process.env.E2E_TENANT_A_SERVICE_ID, staffId: process.env.E2E_TENANT_A_STAFF_ID },
    })
    expect([401, 403, 404, 405]).toContain(response.status())
  })
})
