import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1280]) {
  test(`CV remains readable and navigable at ${width}px`, { tag: '@pages' }, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/cv')
    await page.evaluate(() => document.fonts.ready)
    const nav = page.getByRole('navigation', { name: 'CV navigation' })
    await expect(nav.getByRole('link', { name: 'Work', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Contact', exact: true })).toBeVisible()
    const metrics = await page.evaluate(() => {
      const title = getComputedStyle(document.querySelector('h1')!)
      const body = getComputedStyle(document.querySelector('.tagline')!)
      return {
        width: document.documentElement.scrollWidth,
        viewport: innerWidth,
        titleLineHeight: parseFloat(title.lineHeight) / parseFloat(title.fontSize),
        bodySize: parseFloat(body.fontSize),
        bodyLineHeight: parseFloat(body.lineHeight) / parseFloat(body.fontSize),
      }
    })
    expect(metrics.width).toBeLessThanOrEqual(metrics.viewport)
    expect(metrics.titleLineHeight).toBeGreaterThanOrEqual(1)
    expect(metrics.bodySize).toBeGreaterThanOrEqual(18)
    expect(metrics.bodyLineHeight).toBeGreaterThanOrEqual(1.4)
    await nav.getByRole('link', { name: 'Work', exact: true }).click()
    await expect(page).toHaveURL(/#work$/)
    const project = page.locator('.case-card').first()
    await project.locator('summary').press('Enter')
    await expect(project.locator('dd').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await nav.getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(page.locator('#contact').getByRole('link', { name: /Book a call/ })).toBeVisible()
  })
}

test('project and story disclosures work without JavaScript on a phone', { tag: '@pages' }, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, ...(baseURL ? { baseURL } : {}) })
  try {
    const page = await context.newPage()
    await page.goto('/cv/')
    const project = page.locator('.case-card').first()
    await project.locator('summary').press('Enter')
    await expect(project.locator('dd').first()).toBeVisible()
    await page.locator('.story-details summary').press('Enter')
    await expect(page.locator('.chapters')).toBeVisible()
    await page.locator('.skill-group summary').first().press('Enter')
    await expect(page.locator('.skill-list').first()).toBeVisible()
  } finally { await context.close() }
})
