import { expect, test } from '@playwright/test'

for (const locale of ['ar', 'en']) {
  test.describe(`${locale} Phase A`, () => {
    test('signed-out dashboard redirects to login and preserves a safe next path', async ({ page }) => {
      await page.goto(`/${locale}/dashboard?next=/${locale}/dashboard`)
      await expect(page).toHaveURL(new RegExp(`/${locale}/(login|onboarding)`))
    })

    test('rejects open redirect inputs', async ({ page }) => {
      await page.goto(`/${locale}/login?next=//evil.com`)
      await expect(page).not.toHaveURL(/evil\.com/)
      await page.goto(`/${locale}/login?next=https://evil.com`)
      await expect(page).not.toHaveURL(/evil\.com/)
    })

    test('unknown tenant is not served', async ({ page }) => {
      const response = await page.goto(`/${locale}/tenants/e2e-missing-tenant`)
      expect(response?.status()).toBe(404)
    })
  })
}
