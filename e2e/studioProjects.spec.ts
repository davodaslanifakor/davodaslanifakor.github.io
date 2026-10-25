import { expect, test } from '@playwright/test'

for (const width of [390, 768, 1440]) {
  test(`real product spotlight at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/studio/')
    const spotlight = page.locator('.studio-spotlight')
    await expect(spotlight.locator('[data-product]')).toHaveAttribute(
      'data-product',
      'zoviz',
    )
    await expect(
      spotlight.getByRole('link', {
        name: 'Visit website: zoviz.com',
        exact: true,
      }),
    ).toHaveAttribute('href', 'https://zoviz.com/')
    await expect(spotlight.getByRole('img')).toHaveAccessibleName(
      /public LinkedIn project portfolio/,
    )
    await expect(
      spotlight.getByText('Frontend Technical Lead', { exact: true }),
    ).toBeVisible()
    await expect(
      spotlight.getByRole('link', { name: 'Explore my work', exact: true }),
    ).toHaveAttribute('href', '#project-monitor')
    await page.screenshot({
      path: testInfo.outputPath(`projects-${width}-zoviz-dark.png`),
    })
    if (width === 1440 && testInfo.project.name === 'chromium')
      await spotlight.screenshot({
        path: 'docs/renders/studio-projects/zoviz.png',
      })
    const sarmayex = spotlight.getByRole('button', {
      name: 'Sarmayex',
      exact: true,
    })
    await expect(sarmayex).toBeEnabled()
    await sarmayex.focus()
    await page.keyboard.press('Enter')
    await expect(spotlight.locator('[data-product]')).toHaveAttribute(
      'data-product',
      'sarmayex',
    )
    await expect(sarmayex).toHaveAttribute('aria-pressed', 'true')
    await expect(
      spotlight.getByRole('link', {
        name: 'Visit website: sarmayex.com',
        exact: true,
      }),
    ).toHaveAttribute('href', 'https://sarmayex.com/')
    await expect(
      spotlight.getByText(
        'Current product imagery · my work focused on the web applications',
        { exact: true },
      ),
    ).toBeVisible()
    await expect
      .poll(() =>
        spotlight
          .locator('img')
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true)
    await expect(
      spotlight.getByRole('link', { name: 'Explore my work', exact: true }),
    ).toHaveAttribute('href', '#project-paratrooper')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`projects-${width}-sarmayex-dark.png`),
    })
    if (width === 1440 && testInfo.project.name === 'chromium')
      await spotlight.screenshot({
        path: 'docs/renders/studio-projects/sarmayex.png',
      })
    const ostadbank = spotlight.getByRole('button', { name: 'OstadBank', exact: true })
    await ostadbank.focus()
    await page.keyboard.press('Enter')
    await expect(ostadbank).toHaveAttribute('aria-pressed', 'true')
    await expect(spotlight.locator('[data-product]')).toHaveAttribute('data-product', 'ostadbank')
    await expect(spotlight.getByRole('link', { name: 'Visit website: ostadbank.com', exact: true })).toHaveAttribute('href', 'https://www.ostadbank.com/')
    await expect(spotlight.getByRole('link', { name: 'Explore my work', exact: true })).toHaveAttribute('href', '#career-ostadbank')
    await expect(spotlight.getByText('2017–2022', { exact: true })).toBeVisible()
    await expect(spotlight.getByRole('img')).toHaveAccessibleName(/Current OstadBank public homepage/)
    await expect.poll(() => spotlight.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    if (testInfo.project.name === 'chromium') {
      await spotlight.scrollIntoViewIfNeeded()
      await spotlight.screenshot({ path: `docs/renders/studio-projects/ostadbank-${width}.png` })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: `docs/renders/studio-projects/hero-${width}.png` })
    }
    await page
      .getByRole('button', { name: 'Switch to light mode', exact: true })
      .click()
    await page.screenshot({
      path: testInfo.outputPath(`projects-${width}-sarmayex-light.png`),
    })
    await spotlight.getByRole('button', { name: 'Zoviz', exact: true }).click()
    await expect(spotlight.locator('[data-product]')).toHaveAttribute(
      'data-product',
      'zoviz',
    )
    await page.screenshot({
      path: testInfo.outputPath(`projects-${width}-zoviz-light.png`),
    })
  })
}

test('the product source and work link remain readable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    ...(baseURL ? { baseURL } : {}),
  })
  try {
    const page = await context.newPage()
    await page.goto('/studio/')
    const spotlight = page.locator('.studio-spotlight')
    await expect(
      spotlight.getByRole('link', {
        name: 'Visit website: zoviz.com',
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      spotlight.getByText(
        'Product dashboard · from my public project portfolio',
        { exact: true },
      ),
    ).toBeVisible()
    await spotlight
      .getByRole('link', { name: 'Explore my work', exact: true })
      .click()
    await expect(page).toHaveURL(/#project-monitor$/)
  } finally {
    await context.close()
  }
})

test('projects rotate automatically, with explicit pause and reduced-motion protection', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install()
  await page.goto('/studio/')
  const spotlight = page.locator('.studio-spotlight')
  const panel = spotlight.locator('[data-product]')
  await expect(spotlight.getByRole('button', { name: 'Pause project rotation', exact: true })).toBeVisible()
  await page.mouse.move(10, 10)
  await page.clock.fastForward(7500)
  await expect(panel).toHaveAttribute('data-product', 'sarmayex')
  await page.clock.fastForward(7500)
  await expect(panel).toHaveAttribute('data-product', 'ostadbank')
  await spotlight.hover()
  await page.clock.fastForward(8000)
  await expect(panel).toHaveAttribute('data-product', 'ostadbank')
  await spotlight.getByRole('button', { name: 'OstadBank', exact: true }).focus()
  await page.mouse.move(10, 10)
  await page.clock.fastForward(8000)
  await expect(panel).toHaveAttribute('data-product', 'ostadbank')
  await spotlight.getByRole('button', { name: 'Pause project rotation', exact: true }).click()
  await page.locator('h1').click()
  await page.mouse.move(10, 10)
  await page.clock.fastForward(8000)
  await expect(panel).toHaveAttribute('data-product', 'ostadbank')
  await expect(spotlight.getByRole('button', { name: 'Resume project rotation', exact: true })).toBeVisible()
  await spotlight.getByRole('button', { name: 'Resume project rotation', exact: true }).click()
  await page.locator('h1').click()
  await page.mouse.move(10, 10)
  await page.clock.fastForward(7500)
  await expect(panel).toHaveAttribute('data-product', 'zoviz')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(spotlight.getByRole('button', { name: 'Pause project rotation', exact: true })).toHaveCount(0)
  await page.clock.fastForward(8000)
  await expect(panel).toHaveAttribute('data-product', 'zoviz')
})

test('the desktop product sits beside the headline and inside the opening viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/studio/')
  const headline = await page.locator('.studio-headline').boundingBox()
  const spotlight = await page.locator('.studio-spotlight').boundingBox()
  expect(headline).toBeTruthy()
  expect(spotlight).toBeTruthy()
  expect(spotlight!.x).toBeGreaterThan(headline!.x + headline!.width)
  expect(spotlight!.y).toBeLessThan(headline!.y + headline!.height)
  expect(spotlight!.y + spotlight!.height).toBeLessThanOrEqual(900)
  if (testInfo.project.name === 'chromium')
    await page.screenshot({ path: 'docs/renders/studio-projects/hero-positioned.png' })
})
