import { test, expect } from '@playwright/test'

test('homepage has welcome text', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page.getByText('Bienvenido')).toBeVisible()
})

