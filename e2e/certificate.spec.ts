import { expect, test } from '@playwright/test'

for (const mobile of [false, true]) {
  test(`Vue certificate opens at full size and returns to the room (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
    const trigger = page.locator('[data-object-id="certificate"]')
    await trigger.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Vue.js certification' })
    await expect(dialog).toBeVisible()
    const artwork = dialog.getByRole('img', { name: /Vue.js Developer Level I certificate awarded to Davoud Aslani Fakour/ })
    await expect(artwork).toBeVisible()
    await expect.poll(() => artwork.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(2048)
    const bounds = await artwork.boundingBox()
    expect(bounds!.width / bounds!.height).toBeCloseTo(2048 / 1449, 2)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    await expect(dialog.getByRole('link', { name: 'Verify certificate' })).toHaveAttribute('href', 'https://certificates.dev/c/9b113c4b-9c21-4e60-a1cc-56ba5fb54122')
    const download = dialog.getByRole('link', { name: 'Download certificate' })
    const pdf = await page.request.get((await download.getAttribute('href'))!)
    expect(pdf.ok()).toBe(true)
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}
