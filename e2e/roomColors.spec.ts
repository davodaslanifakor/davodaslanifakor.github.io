import { expect, test } from '@playwright/test'
import { ui } from '../content/portfolio'

test('default RGB lights activate and replay without color configuration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const scene = page.locator('.room-scene')
  await expect(scene).toHaveAttribute('data-light-phase', 'off')
  await expect(scene).toHaveAttribute('data-color-mode', 'rgb')
  await expect(scene).toHaveAttribute('data-light-progress', '0')
  for (const name of ['Warm', 'RGB', 'Pause colors', 'Resume colors']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
  }
  await page.getByRole('button', { name: ui.enterRoom.en, exact: true }).press('Enter')
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-color-motion', 'running')
  await expect(scene).toHaveAttribute('data-light-progress', '1')
  const replay = page.getByRole('button', { name: ui.replayRoomLights.en, exact: true })
  await replay.click()
  await expect(scene).toHaveAttribute('data-light-phase', 'revealing')
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await replay.press('Space')
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-light-progress', '1')
  await expect(scene).toHaveAttribute('data-color-mode', 'rgb')
  await page.getByRole('button', { name: 'Visual editor' }).click()
  await expect(page.getByRole('dialog', { name: 'Live visual editor' })).toBeVisible()
  await expect(replay).toHaveCount(0)
  await expect(scene).toHaveAttribute('data-color-motion', 'paused')
})

test('reduced motion keeps the default RGB spectrum static through activation and replay', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const scene = page.locator('.room-scene')
  await expect(scene).toHaveAttribute('data-light-phase', 'off')
  await page.getByRole('button', { name: ui.enterRoom.en, exact: true }).click()
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-color-mode', 'rgb')
  await expect(scene).toHaveAttribute('data-color-motion', 'static')
  await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
  await page.screenshot({ path: `docs/renders/joker-adventure/finished-room-${testInfo.project.name}.png` })
  await page.getByRole('button', { name: ui.replayRoomLights.en, exact: true }).click()
  await expect(scene).toHaveAttribute('data-light-phase', 'on')
  await expect(scene).toHaveAttribute('data-light-progress', '1')
  await expect(scene).toHaveAttribute('data-color-motion', 'static')
  for (const name of ['Warm', 'RGB', 'Pause colors', 'Resume colors']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
  }
})

test('mobile light button remains reachable without color configuration or overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: ui.enterRoom.en, exact: true })).toBeInViewport()
  await page.getByRole('button', { name: ui.enterRoom.en, exact: true }).press('Enter')
  const replay = page.getByRole('button', { name: ui.replayRoomLights.en, exact: true })
  await expect(replay).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await replay.press('Enter')
  await expect(page.locator('.room-scene')).toHaveAttribute('data-light-phase', 'on')
  for (const label of [ui.roomColorWarm, ui.roomColorRgb, ui.pauseRoomColors, ui.resumeRoomColors]) {
    await expect(page.getByRole('button', { name: label.en, exact: true })).toHaveCount(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
