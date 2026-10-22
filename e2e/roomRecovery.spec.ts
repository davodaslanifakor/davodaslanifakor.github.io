import { expect, test } from '@playwright/test'

test('room load failure offers retry and then finishes the room', async ({ page }) => {
  await page.route('**/models/room.glb', route => route.fulfill({ status: 503, body: 'Unavailable' }), { times: 1 })
  await page.goto('/')
  const recovery = page.getByRole('alert')
  await expect(recovery).toContainText('The room couldn’t finish loading.')
  await recovery.getByRole('button', { name: 'Reload room' }).click()
  await expect(page.locator('.room-scene')).toHaveAttribute('data-render-ready', 'true', { timeout: 20000 })
  await expect(recovery).toBeHidden()
  await page.getByRole('button', { name: 'Step inside' }).click()
  await expect(page.locator('.room-scene')).toHaveAttribute('data-light-phase', 'on')
})

test('losing the graphics context offers recovery without trapping navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.room-scene')).toHaveAttribute('data-render-ready', 'true', { timeout: 20000 })
  await page.locator('.room-scene canvas').evaluate(canvas => {
    (canvas as HTMLCanvasElement).getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(page.getByRole('alert')).toContainText('The room couldn’t finish loading.')
  await page.getByRole('button', { name: 'Reload room' }).click()
  await expect(page.locator('.room-scene')).toHaveAttribute('data-render-ready', 'true', { timeout: 20000 })
})
