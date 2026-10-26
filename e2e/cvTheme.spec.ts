import { expect, test } from '@playwright/test'

const light = 'rgb(243, 239, 231)'
const dark = 'rgb(21, 24, 23)'

test('CV follows the system until a keyboard choice is made, then remembers it', { tag: '@pages' }, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/cv/')
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', light)
  const toggle = page.getByRole('button', { name: 'Switch to dark mode' })
  await toggle.focus()
  await expect(toggle).toBeFocused()
  await toggle.press('Enter')
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
  await expect(page.locator('body')).toHaveCSS('background-color', dark)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.getByRole('button', { name: 'Switch to light mode' }).press('Space')
  await page.reload()
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', light)
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  // Keep the compact mobile header in one row, with an accessible touch target.
  const nav = await page.locator('.cv-nav').boundingBox()
  const button = await page.locator('.cv-theme-toggle').boundingBox()
  expect(nav!.height).toBeLessThanOrEqual(64)
  expect(button!.width).toBeGreaterThanOrEqual(44)
  expect(button!.height).toBeGreaterThanOrEqual(44)
})

test('a saved preference applies before the application scripts load', { tag: '@pages' }, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript(() => localStorage.setItem('portfolio-cv-theme', 'dark'))
  await page.route('**/_nuxt/**', route => route.request().resourceType() === 'script' ? route.abort() : route.continue())
  await page.goto('/cv/')
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
  await expect(page.getByRole('heading', { name: 'Davoud Aslani Fakour', exact: true })).toBeVisible()
})

test('CV system colors remain readable without JavaScript', { tag: '@pages' }, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', ...(baseURL ? { baseURL } : {}) })
  try {
    const page = await context.newPage()
    await page.goto('/cv/')
    await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
    await expect(page.getByRole('button', { name: /Switch to/ })).toBeHidden()
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('.cv-page')).toHaveCSS('background-color', light)
  } finally { await context.close() }
})

test('the preference syncs across CV tabs and stays out of the room', { tag: '@pages' }, async ({ page, context }) => {
  await context.addInitScript(() => localStorage.removeItem('portfolio-cv-theme'))
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/cv/')
  const other = await context.newPage()
  try {
    await other.emulateMedia({ colorScheme: 'light' })
    await other.goto('/cv/')
    await expect(other.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(other.locator('.cv-page')).toHaveCSS('background-color', dark)
    await expect(other.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
    await page.getByRole('link', { name: 'Davoud Aslani Fakour home', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).not.toHaveClass(/cv-document/)
    await expect(page.locator('html')).not.toHaveAttribute('data-cv-theme')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 13, 15)')
    await page.goBack()
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
    await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
  } finally { await other.close() }
})

test('the toggle works when saving the theme is blocked', { tag: '@pages' }, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    const setItem = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'portfolio-cv-theme') throw new DOMException('Storage blocked', 'SecurityError')
      return getItem.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'portfolio-cv-theme') throw new DOMException('Storage blocked', 'SecurityError')
      setItem.call(this, key, value)
    }
  })
  await page.goto('/cv/')
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', dark)
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('.cv-page')).toHaveCSS('background-color', light)
})
