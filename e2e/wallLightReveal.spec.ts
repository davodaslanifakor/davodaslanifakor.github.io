import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openDarkRoom(page: Page) {
  await page.goto('/')
  const scene = page.locator('.room-scene')
  await expect(scene).toHaveAttribute('data-light-phase', 'off')
  await expect(scene).toHaveAttribute('data-light-progress', '0')
  await expect(scene).toHaveAttribute('data-lighting', 'dark')
  await expect(scene).toHaveCSS('background-color', 'rgb(9, 11, 12)')
  await expect(scene.locator('canvas').first()).toBeVisible()
  await expect(scene.getByRole('status')).toHaveCount(0)
  return scene
}

test('first page click preserves its action, reveals lights, and supports repeated replay', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
  const scene = await openDarkRoom(page)
  await page.getByRole('button', { name: 'World clocks' }).click()
  await expect(page.getByRole('dialog', { name: 'Around the world' })).toBeVisible()
  await expect(scene).toHaveAttribute('data-light-phase', 'revealing')
  await expect.poll(async () => Number(await scene.getAttribute('data-light-progress'))).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: 'Replay room lights' })).toHaveCount(0)
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-light-progress', '1')
  await expect(scene).toHaveAttribute('data-lighting', 'light')
  await page.keyboard.press('Escape')

  const replay = page.getByRole('button', { name: 'Replay room lights' })
  await replay.click()
  await expect(scene).toHaveAttribute('data-light-phase', 'revealing')
  await expect.poll(async () => Number(await scene.getAttribute('data-light-progress'))).toBeGreaterThan(0.2)
  await replay.click()
  await expect(scene).toHaveAttribute('data-light-phase', 'revealing')
  await expect.poll(async () => Number(await scene.getAttribute('data-light-progress'))).toBeLessThan(1)
  await expect(scene).toHaveAttribute('data-light-phase', 'on')

  await page.getByRole('button', { name: 'Visual editor' }).click()
  await expect(page.getByRole('dialog', { name: 'Live visual editor' })).toBeVisible()
  await expect(replay).toHaveCount(0)
  await page.locator('.editor-shell--compact input[type="color"]').fill('#ff3366')
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-light-progress', '1')
})

for (const key of ['Enter', 'Space']) {
  test(`light switch and replay finish immediately with ${key}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const scene = await openDarkRoom(page)
    const entry = page.getByRole('button', { name: 'Step inside' })
    await expect(entry).toBeEnabled()
    await entry.press(key)
    await expect(scene).toHaveAttribute('data-light-phase', 'on')
    await expect(scene).toHaveAttribute('data-light-progress', '1')
    await expect(page.getByRole('button', { name: 'Replay room lights' })).toBeFocused()
    await page.getByRole('button', { name: 'Replay room lights' }).press(key)
    await expect(scene).toHaveAttribute('data-light-phase', 'on')
    await expect(scene).toHaveAttribute('data-light-progress', '1')
  })
}

test('reduced motion skips the reveal on pointer activation and replay', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  const scene = await openDarkRoom(page)
  await page.getByRole('button', { name: 'Step inside' }).click()
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-light-progress', '1')
  await page.getByRole('button', { name: 'Replay room lights' }).click()
  await expect(scene).toHaveAttribute('data-light-progress', '1')
  await expect(scene).toHaveAttribute('data-lighting', 'dark')
})

test('mobile light control fits the viewport and navigation remains immediately usable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const scene = await openDarkRoom(page)
  await expect(page.getByRole('link', { name: /skip to cv/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Contact ↗' })).toBeVisible()
  const control = page.getByRole('button', { name: 'Step inside' })
  await expect(control).toBeInViewport()
  await control.click()
  await expect(scene).toHaveAttribute('data-light-phase', 'revealing')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Replay room lights' })).toBeInViewport()
  await page.getByRole('link', { name: 'Contact ↗' }).click()
  await expect(page).toHaveURL(/\/cv#contact$/)
})
