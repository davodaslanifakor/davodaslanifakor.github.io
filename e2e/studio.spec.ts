import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1280]) {
  test(`studio layout and project browsing at ${width}px`, { tag: '@pages' }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/studio/')
    await expect(
      page.getByRole('button', { name: 'Switch to light mode', exact: true }),
    ).toBeEnabled()
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    const first = page.getByRole('button', {
      name: 'Explore project: A Vue editor for people who create.',
      exact: true,
    })
    await first.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: 'A Vue editor for people who create.', exact: true }),
    ).toBeVisible()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await dialog.getByRole('button', { name: /Next project/ }).click()
    await expect(
      dialog.getByRole('heading', { name: 'Production errors, made actionable.', exact: true }),
    ).toBeVisible()
    await expect(dialog.getByText('Investigation & frontend implementation', { exact: true })).toBeVisible()
    await page.keyboard.press('Shift+Tab')
    expect(
      await page.evaluate(() => document.querySelector('dialog')!.contains(document.activeElement)),
    ).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(first).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page
      .locator('#contact')
      .getByRole('link', { name: 'Let’s talk', exact: true })
      .scrollIntoViewIfNeeded()
    await expect(
      page.locator('#contact').getByRole('link', { name: 'Let’s talk', exact: true }),
    ).toHaveAttribute('href', 'https://calendly.com/davodaslanifakor/request-call')
  })
}

test(
  'theme reveal completes, persists, and does not leak into the CV',
  { tag: '@pages' },
  async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/studio/motion/')
    await page.getByRole('button', { name: 'Change the atmosphere', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'light')
    await expect(
      page.getByRole('button', { name: 'Change the atmosphere', exact: true }),
    ).toBeEnabled()
    await expect(page.locator('html')).not.toHaveAttribute('data-studio-transition')
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Switch to dark mode', exact: true }),
    ).toBeVisible()
    await page.getByText('Soft sweep', { exact: true }).click()
    await page.getByRole('button', { name: 'Change the atmosphere', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'dark')
    await expect(
      page.getByRole('button', { name: 'Change the atmosphere', exact: true }),
    ).toBeEnabled()
    await page.locator('.studio-navigation').getByRole('link', { name: 'Read CV', exact: true }).click()
    await expect(page.locator('.cv-page')).toBeVisible()
    await expect(page.locator('html')).not.toHaveClass(/studio-document/)
    await expect(page.locator('html')).not.toHaveAttribute('data-studio-theme')
    await expect(page.getByRole('heading', { name: 'Davoud Fakour', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  },
)

test(
  'the working editor supports typing, keyboard movement, reset and a real export',
  { tag: '@pages' },
  async ({ page }) => {
    await page.goto('/studio/')
    await page.getByLabel('Your text', { exact: true }).fill('Hello, world.')
    const text = page.getByRole('group', {
      name: 'Drag the name, or focus it and use the arrow keys.',
      exact: true,
    })
    await expect(text).toHaveText('Hello, world.')
    await text.press('ArrowRight')
    await expect(text).not.toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
    await page.getByRole('button', { name: 'Sunlight', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sunlight', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Save image', exact: true }).click()
    expect((await download).suggestedFilename()).toBe('davoud-fakour-studio.png')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(page.getByLabel('Your text', { exact: true })).toHaveValue('Make it yours.')
    await expect(text).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  },
)

test(
  'process and capabilities are operable with a keyboard',
  { tag: '@pages' },
  async ({ page }) => {
    await page.goto('/studio/')
    await page.getByText('More on how I work', { exact: true }).click()
    await expect(page.getByRole('button', { name: '05 Validate', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: '05 Validate', exact: true }).press('Enter')
    await expect(page.locator('#studio-process-detail')).toContainText('end-to-end tests')
    await page.getByRole('button', { name: 'TypeScript', exact: true }).press('Enter')
    await expect(page.locator('.studio-capability-detail')).toContainText(
      'Reliable contracts across large frontend codebases.',
    )
  },
)

test(
  'reduced motion and unsupported view transitions retain theme controls',
  { tag: '@pages' },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() =>
      Object.defineProperty(document, 'startViewTransition', { value: undefined }),
    )
    await page.goto('/studio/')
    await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-studio-theme', 'light')
    await expect(page.locator('html')).not.toHaveAttribute('data-studio-transition')
    await expect(page.locator('.studio-cursor')).not.toBeVisible()
    await page
      .getByRole('button', { name: 'Explore project: Production errors, made actionable.', exact: true })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  },
)

test(
  'studio content and links render without JavaScript',
  { tag: '@pages' },
  async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      ...(baseURL ? { baseURL } : {}),
    })
    try {
      const page = await context.newPage()
      await page.goto('/studio/')
      await expect(
        page.getByRole('heading', { name: 'I build tools people create with.', exact: true }),
      ).toBeVisible()
      await expect(
        page.getByText('A reusable, multi-page Vue editor: direct manipulation, layers, non-destructive cropping, synchronized brand colors, and export. Packaged for the main product and admin tools.', {
          exact: true,
        }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Read CV', exact: true }).first()).toBeVisible()
      await page.getByRole('link', { name: 'Try the theme study', exact: true }).click()
      await expect(
        page.getByRole('heading', { name: 'A change of atmosphere.', exact: true }),
      ).toBeVisible()
    } finally {
      await context.close()
    }
  },
)

test(
  'desktop motion responds to intent and stops with reduced motion',
  { tag: '@pages' },
  async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/studio/')
    await expect(
      page.getByRole('button', { name: 'Switch to light mode', exact: true }),
    ).toBeEnabled()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: testInfo.outputPath('studio-dark.png') })
    const heroLayer = page.locator('.studio-hero-preview .visual-main')
    const heroBefore = await heroLayer.evaluate((element) => getComputedStyle(element).transform)
    await page.locator('.studio-hero h1').hover({ position: { x: 40, y: 40 } })
    await expect
      .poll(() => heroLayer.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(heroBefore)
    const project = page.locator('.studio-project').first()
    await project.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        project
          .locator('.studio-reveal')
          .first()
          .evaluate((element) => element.getAnimations().length),
      )
      .toBeGreaterThan(0)
    const main = project.locator('.visual-main')
    const before = await main.evaluate((element) => getComputedStyle(element).transform)
    await project.locator('.studio-visual-button').hover()
    await expect
      .poll(() => main.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(before)
    await expect(page.locator('.studio-cursor')).toContainText('View')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page.locator('.studio-cursor')).not.toBeVisible()
    await expect(main).toHaveCSS('transform', 'none')
    await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click()
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({ path: testInfo.outputPath('studio-light.png') })
  },
)

test(
  'touch editor movement stays bounded and project stories close naturally',
  { tag: '@pages' },
  async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      ...(baseURL ? { baseURL } : {}),
    })
    try {
      const page = await context.newPage()
      await page.goto('/studio/')
      await expect(
        page.getByRole('button', { name: 'Switch to light mode', exact: true }),
      ).toBeEnabled()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: testInfo.outputPath('studio-mobile.png') })
      const text = page.locator('.studio-editable-text')
      await text.scrollIntoViewIfNeeded()
      await text.hover()
      const before = await text.boundingBox()
      const canvas = await page.locator('.studio-editor-canvas').boundingBox()
      await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2)
      await page.mouse.down()
      await page.mouse.move(
        before!.x + before!.width / 2 + 120,
        before!.y + before!.height / 2 + 100,
        { steps: 8 },
      )
      await page.mouse.up()
      const after = await text.boundingBox()
      expect(after!.x).toBeGreaterThan(before!.x)
      expect(after!.x + after!.width).toBeLessThanOrEqual(canvas!.x + canvas!.width + 1)
      await page.getByRole('button', { name: 'Reset', exact: true }).tap()
      await expect(text).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
      await page
        .getByRole('button', {
          name: 'Explore project: A Vue editor for people who create.',
          exact: true,
        })
        .tap()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Close project', exact: true }).tap()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await expect(page.locator('.studio-cursor')).not.toBeVisible()
    } finally {
      await context.close()
    }
  },
)

test('browsing the studio does not preload the 3D room', { tag: '@pages' }, async ({ page }) => {
  const requests: string[] = []
  const errors: string[] = []
  page.on('request', request => { if (/draco|models\//.test(request.url())) requests.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/studio/')
  const roomLink = page.getByRole('link', { name: 'Explore the room', exact: true })
  await roomLink.scrollIntoViewIfNeeded()
  await roomLink.hover()
  await page.waitForLoadState('networkidle')
  expect(requests).toEqual([])
  expect(errors).toEqual([])
})
