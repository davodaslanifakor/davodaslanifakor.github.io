import { expect, test } from '@playwright/test'

test('entry offers a working CV route while the 3D asset is still loading', async ({ page }) => {
  await page.route('**/models/room.glb', () => {})
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const entry = page.getByRole('region', { name: 'Choose your way in' })
  await expect(entry.getByRole('heading', { name: 'Take a look around.' })).toBeVisible()
  await expect(entry.getByRole('button', { name: 'Step inside' })).toBeDisabled()
  await entry.getByRole('link', { name: 'View my CV' }).click()
  await expect(page).toHaveURL(/\/cv\/?$/)
  await expect(page.getByRole('heading', { name: 'Davoud Aslani Fakour', exact: true })).toBeVisible()
})

test('entry and its CV link are available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ...(baseURL ? { baseURL } : {}) })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const entry = page.getByRole('region', { name: 'Choose your way in' })
    await expect(entry.getByRole('button', { name: 'Step inside' })).toBeDisabled()
    await entry.getByRole('link', { name: 'View my CV' }).click()
    await expect(page).toHaveURL(/\/cv\/?$/)
    await expect(page.getByRole('heading', { name: 'Davoud Aslani Fakour', exact: true })).toBeVisible()
  } finally { await context.close() }
})
