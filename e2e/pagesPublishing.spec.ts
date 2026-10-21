import { expect, test } from '@playwright/test'

test('CV is readable without JavaScript on static hosting', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ...(baseURL ? { baseURL } : {}) })
  try {
    const page = await context.newPage()
    const requested: string[] = []
    page.on('request', request => requested.push(request.url()))
    const response = await page.goto('/cv/')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Davoud Fakour', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'LinkedIn', exact: true })).toBeVisible()
    expect(requested.some(url => /\/models\/|\/draco\//.test(url))).toBe(false)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://davodaslanifakor.github.io/cv/')
  } finally { await context.close() }
})

test('legacy Modaltor links retain their anchors and still open the demo', async ({ page }) => {
  await page.goto('/modaltor/#basic')
  await expect(page).toHaveURL(/\/modaltor\.html#basic$/)
  await expect(page.getByRole('heading', { name: 'This Is Demo vue-modaltor', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'basic', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'game of thrones quotes', exact: true }).first()).toBeVisible()
})
