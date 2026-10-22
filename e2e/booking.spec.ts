import { expect, test } from '@playwright/test'

for (const mobile of [false, true]) {
  test(`MacBook booking opens on demand and returns to the room (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    let loads = 0
    await page.route('https://calendly.com/davodaslanifakor/request-call?**', route => {
      loads++
      return route.fulfill({ contentType: 'text/html', body: '<main><h1>Choose a time</h1><label>Name <input aria-label="Name"></label><button>Next</button></main>' })
    })
    await page.goto('/')
    await expect(page.locator('.room-scene')).toHaveAttribute('data-render-ready', 'true')
    expect(loads).toBe(0)
    await page.getByRole('button', { name: 'Step inside', exact: true }).click()
    await expect(page.locator('.room-scene')).toHaveAttribute('data-light-phase', 'on')
    const trigger = page.getByRole('button', { name: 'Book a call', exact: false })
    if (mobile) await trigger.press('Enter')
    else {
      // The inactive editor shares the physical screen alignment. Its hidden DOM
      // must not intercept the raycast into the laptop screen beneath it.
      const screen = page.locator('.monitor-editor-surface')
      await expect(screen).toHaveCSS('transform', /matrix3d/)
      await expect.poll(async () => (await screen.boundingBox())?.width ?? 0).toBeGreaterThan(20)
      const bounds = (await screen.boundingBox())!
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    }
    const booking = page.getByRole('dialog', { name: 'Let’s talk', exact: true })
    await expect(booking).toBeVisible()
    const iframe = booking.locator('iframe')
    await expect(iframe).toHaveAttribute('src', /calendly.com\/davodaslanifakor\/request-call\?embed_domain=127.0.0.1&embed_type=Inline/)
    const calendar = page.frameLocator('iframe[title="Schedule a call with Davoud on Calendly"]')
    await expect(calendar.getByRole('heading', { name: 'Choose a time' })).toBeVisible()
    const back = booking.getByRole('button', { name: 'Back to the room' })
    await expect(back).toBeFocused()
    await expect(back).toBeInViewport()
    await expect(booking.getByRole('link', { name: 'Open Calendly' })).toHaveAttribute('href', 'https://calendly.com/davodaslanifakor/request-call')
    await calendar.getByRole('textbox', { name: 'Name' }).fill('Keep this selection')
    await page.setViewportSize(mobile ? { width: 844, height: 390 } : { width: 1100, height: 820 })
    await expect(booking).toBeVisible()
    await expect(calendar.getByRole('textbox', { name: 'Name' })).toHaveValue('Keep this selection')
    expect(loads).toBe(1)
    const bounds = await iframe.boundingBox()
    expect(bounds!.width).toBeGreaterThan(300)
    expect(bounds!.height).toBeGreaterThan(250)
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    await back.click()
    await expect(booking).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(iframe).toHaveCount(0)
    await trigger.press('Enter')
    await expect(booking).toBeVisible()
    await booking.getByRole('button', { name: 'Back to the room' }).press('Escape')
    await expect(booking).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
}

test('a stalled calendar keeps the return and external link available', async ({ page }) => {
  await page.route('https://calendly.com/**', () => {})
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
  await page.getByRole('button', { name: 'Book a call', exact: false }).click()
  const booking = page.getByRole('dialog', { name: 'Let’s talk', exact: true })
  await expect(booking.getByRole('status')).toHaveText('Opening the calendar…')
  await expect(booking.getByRole('link', { name: 'Open Calendly' })).toBeVisible()
  await booking.getByRole('button', { name: 'Back to the room' }).click()
  await expect(booking).toHaveCount(0)
})
