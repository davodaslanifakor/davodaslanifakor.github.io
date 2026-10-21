import { expect, test } from '@playwright/test'

async function openRoom(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
}

test('recruiter can reach the CV and scan core sections', { tag: '@pages' }, async ({ page }) => {
  await openRoom(page)
  await page.getByRole('link', { name: /skip to cv/i }).click()
  await expect(page).toHaveURL(/\/cv$/)
  await expect(page.getByRole('heading', { name: 'Davoud Fakour' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Selected work' })).toBeVisible()
})

test('accessible room navigation opens and closes project content', async ({ page }) => {
  test.slow()
  await openRoom(page)
  const modalActions = [
    ['Selected work', 'Selected work'],
    ['Skills and tools', 'Skills'],
    ['Career timeline', 'Experience'],
    ['Architecture approach', 'Architecture approach'],
  ] as const

  for (const [control, dialog] of modalActions) {
    await page.getByRole('button', { name: control }).click()
    await expect(page.getByRole('dialog', { name: dialog })).toBeVisible()
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByRole('dialog', { name: dialog })).toBeHidden()
  }

  await expect(page.getByRole('button', { name: 'Welcome', exact: true })).toHaveCount(0)

  await expect(page.getByRole('button', { name: /ambient sound: off/i })).toBeVisible()
  await page.getByRole('button', { name: /ambient sound: off/i }).click()
  await expect(page.getByRole('button', { name: /ambient sound: on/i })).toBeVisible()
})

test('world clocks and the mobile preview are reachable by keyboard navigation', async ({ page }) => {
  await openRoom(page)
  const clockControl = page.getByRole('button', { name: 'World clocks' })
  await clockControl.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Around the world' })).toBeVisible()
  await expect(page.locator('.clock-card')).toHaveCount(4)
  await expect(page.locator('.clock-card').last()).toContainText('Atlantic')
  await expect(page.locator('.clock-card strong').first()).toHaveText(/^\d{2}:\d{2}$/)
  await expect(page.locator('.room-times')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /close/i })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(clockControl).toBeFocused()

  await page.getByRole('button', { name: 'Mobile preview' }).click()
  const preview = page.getByRole('dialog', { name: 'On your phone' })
  await expect(preview).toBeVisible()
  const frame = preview.locator('iframe[title="Mobile preview of the CV page"]')
  await expect(frame).toHaveAttribute('src', '/cv')
  await expect(page.frameLocator('iframe[title="Mobile preview of the CV page"]').locator('#experience')).toBeAttached()
  await expect(preview.getByRole('link', { name: /open the cv/i })).toHaveAttribute('href', '/cv')
  await page.getByRole('button', { name: /close/i }).click()
})

test('contact remains one click away in the persistent HUD', { tag: '@pages' }, async ({ page }) => {
  await openRoom(page)
  await page.getByRole('link', { name: 'Contact ↗' }).click()
  await expect(page).toHaveURL(/\/cv#contact$/)
})

test('visual editor supports color, drag, reset, and Escape', async ({ page }) => {
  await openRoom(page)
  await page.getByRole('button', { name: 'Visual editor' }).click()
  await expect(page.getByRole('dialog', { name: 'Live visual editor' })).toBeVisible()

  const visibleEditor = page.locator('.editor-shell--compact')
  const color = visibleEditor.locator('input[type="color"]')
  await color.fill('#ff3366')
  await expect(color).toHaveValue('#ff3366')

  const editable = visibleEditor.locator('.editable')
  const before = await editable.getAttribute('style')
  const bounds = await editable.boundingBox()
  expect(bounds).not.toBeNull()
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds!.x + bounds!.width / 2 + 36, bounds!.y + bounds!.height / 2 + 18, { steps: 4 })
  await page.mouse.up()
  await expect(editable).not.toHaveAttribute('style', before ?? '')

  await visibleEditor.locator('button').filter({ hasText: 'Reset' }).evaluate((button: HTMLButtonElement) => button.click())
  await expect(color).toHaveValue('#d8ff3e')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Live visual editor' })).toBeHidden()
})

test('mobile opens the editor as a full-screen DOM surface', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openRoom(page)
  await page.getByRole('button', { name: 'Visual editor' }).click()
  await expect(page.locator('.editor-mobile')).toBeVisible()
  await expect(page.locator('.editor-mobile').getByRole('button', { name: 'Export PNG' })).toBeVisible()
})

test('mobile room uses the viewport without horizontal page overflow', { tag: '@pages' }, async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await openRoom(page)
  await expect(page.getByRole('link', { name: /skip to cv/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'World clocks' })).toBeVisible()
  const metrics = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    sceneHeight: document.querySelector('.room-scene')?.getBoundingClientRect().height,
  }))
  expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth)
  expect(metrics.sceneHeight).toBe(800)
})

test('English-only release offers no language switch, even with a saved Persian choice', { tag: '@pages' }, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-locale', 'fa'))
  await page.goto('/cv')
  await expect(page.locator('.cv-page')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.cv-page')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByRole('button', { name: 'FA' })).toHaveCount(0)
})

test('system lighting changes on the same scene and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await openRoom(page)
  const scene = page.locator('.room-scene')
  await expect(scene).toHaveAttribute('data-light-phase', 'off')
  await page.getByRole('button', { name: 'Turn on room lights' }).press('Enter')
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-lighting', 'light')
  await expect(page.locator('.intro-title')).toHaveCSS('color', 'rgb(34, 40, 34)')
  const canvas = page.locator('.room-scene canvas').first()
  await expect(canvas).toBeVisible()
  await expect(scene.getByRole('status')).toHaveCount(0)
  const light = await canvas.screenshot()
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await expect(scene).toHaveAttribute('data-lighting', 'dark')
  await expect(page.locator('.intro-title')).toHaveCSS('color', 'rgb(242, 239, 232)')
  await expect.poll(async () => (await canvas.screenshot()).equals(light)).toBe(false)
  await page.getByRole('button', { name: 'Visual editor' }).click()
  await expect(page.getByRole('dialog', { name: 'Live visual editor' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Visual editor' })).toBeFocused()
})
