import { expect, test } from '@playwright/test'
import { ui } from '../content/portfolio'
import { SCREEN_THEMES } from '../utils/screenTheme'

test('collapsed screen styles support keyboard selection and repaint both real canvases', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillRect
    const fills: Record<string, string> = {}
    Object.assign(window, { screenBaseFills: fills })
    CanvasRenderingContext2D.prototype.fillRect = function (x, y, w, h) {
      if (x === 0 && y === 0 && typeof this.fillStyle === 'string'
        && ((w === 512 && h === 144) || (w === 240 && h === 158))) fills[`${w}`] = this.fillStyle
      original.call(this, x, y, w, h)
    }
  })
  await page.goto('/')
  await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
  const toggle = page.locator('summary').filter({ hasText: ui.screenStylePreview.en })
  const palette = page.getByRole('group', { name: ui.screenTheme.en })
  await expect(palette).toBeHidden()
  await toggle.press('Enter')
  await expect(palette).toBeVisible()
  const slate = page.getByRole('radio', { name: ui.screenThemes.slate.en, exact: true })
  await expect(slate).toBeChecked()
  await slate.focus()
  for (const id of ['forest', 'amber', 'mono', 'slate'] as const) {
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: ui.screenThemes[id].en, exact: true })).toBeChecked()
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'screenBaseFills'))).toEqual({ 512: SCREEN_THEMES[id].base, 240: SCREEN_THEMES[id].base })
  }
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  await expect(toggle).toBeFocused()
  await toggle.press('Space')
  await expect(slate).toBeChecked()
})

test('screen styles and essential HUD actions fit a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
  const toggle = page.locator('summary').filter({ hasText: ui.screenStylePreview.en })
  await expect(toggle).toBeInViewport()
  await expect(page.getByRole('link', { name: /skip to cv/i })).toBeInViewport()
  await expect(page.getByRole('link', { name: 'Contact ↗' })).toBeInViewport()
  await toggle.click()
  const group = page.getByRole('group', { name: ui.screenTheme.en })
  const bounds = await group.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360)
  await page.getByText(ui.screenThemes.amber.en, { exact: true }).click()
  await expect(page.getByRole('radio', { name: ui.screenThemes.amber.en, exact: true })).toBeChecked()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('the ultrawide clock crosses Istanbul midnight while a preview theme stays selected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date('2026-10-21T20:59:30Z') })
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (this.canvas.width === 2048 && this.canvas.height === 576 && text.startsWith('Istanbul ')) {
        Reflect.set(window, 'screenHomeTime', text)
      }
      if (maxWidth === undefined) original.call(this, text, x, y)
      else original.call(this, text, x, y, maxWidth)
    }
  })
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'screenHomeTime'))).toBe('Istanbul 23:59')
  await page.locator('summary').filter({ hasText: ui.screenStylePreview.en }).press('Enter')
  const forest = page.getByRole('radio', { name: ui.screenThemes.forest.en, exact: true })
  await forest.press('Space')
  await expect(forest).toBeChecked()
  await page.clock.fastForward(60_000)
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'screenHomeTime'))).toBe('Istanbul 00:00')
  await expect(forest).toBeChecked()
})
