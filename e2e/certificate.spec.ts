import { expect, test } from '@playwright/test'

for (const frame of [
  { id: 'certificate', title: 'Vue.js certification', width: 2048, height: 1449 },
  { id: 'library_portrait', title: 'Framed portrait', width: 512, height: 512 },
]) for (const mobile of [false, true]) {
  test(`${frame.title} zooms, pans, fits, and returns to the room (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
    const trigger = page.locator(`[data-object-id="${frame.id}"]`)
    await trigger.press('Enter')
    const dialog = page.getByRole('dialog', { name: frame.title })
    await expect(dialog).toBeVisible()
    const artwork = dialog.getByRole('img')
    await expect(artwork).toBeVisible()
    await expect.poll(() => artwork.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(frame.width)
    // Vue's enter-from scale can exist for a frame even with reduced motion.
    // Measure the resting artwork, not that temporary scale.
    await expect(page.locator('.backdrop')).toHaveCSS('transform', 'none')
    const bounds = await artwork.boundingBox()
    expect(bounds!.width / bounds!.height).toBeCloseTo(frame.width / frame.height, 2)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    const viewport = dialog.locator('.artwork-viewport')
    await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await expect(viewport).toHaveAttribute('data-zoom', '1.5')
    await expect.poll(async () => (await artwork.boundingBox())!.width).toBeCloseTo(bounds!.width * 1.5, 0)
    await viewport.press('+')
    await expect(viewport).toHaveAttribute('data-zoom', '2')
    for (let i = 0; i < 4; i++) await viewport.press('+')
    await expect.poll(async () => (await artwork.boundingBox())!.width).toBeCloseTo(bounds!.width * 4, 0)
    const beforePan = await artwork.boundingBox()
    await viewport.press('ArrowDown')
    await expect.poll(async () => (await artwork.boundingBox())!.y).toBeLessThan(beforePan!.y)
    await viewport.press('0')
    await expect(viewport).toHaveAttribute('data-zoom', '1')
    await viewport.hover()
    await page.mouse.wheel(0, -180)
    await expect.poll(async () => Number(await viewport.getAttribute('data-zoom'))).toBeGreaterThan(1)
    await dialog.getByRole('button', { name: 'Fit image', exact: true }).click()
    await expect(viewport).toHaveAttribute('data-zoom', '1')
    await expect(dialog.getByRole('button', { name: 'Zoom out', exact: true })).toBeDisabled()
    await expect(dialog.getByRole('link', { name: 'Open original' })).toHaveAttribute('target', '_blank')
    if (frame.id === 'certificate') {
      await expect(dialog.getByRole('link', { name: 'Verify certificate' })).toHaveAttribute('href', 'https://certificates.dev/c/9b113c4b-9c21-4e60-a1cc-56ba5fb54122')
      const download = dialog.getByRole('link', { name: 'Download certificate' })
      const pdf = await page.request.get((await download.getAttribute('href'))!)
      expect(pdf.ok()).toBe(true)
      expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-')
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}
