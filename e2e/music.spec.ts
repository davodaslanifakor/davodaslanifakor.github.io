import { expect, test } from '@playwright/test'

for (const mobile of [false, true]) {
  test(`speakers open the monitor library and Spotify preview (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // Exercise our integration without depending on Spotify's network or account state.
    await page.route('https://open.spotify.com/embed/**', route => route.fulfill({ contentType: 'text/html', body: '<button>Spotify test player</button>' }))
    await page.route('https://open.spotify.com/embed/iframe-api/v1', route => route.fulfill({
      contentType: 'application/javascript',
      body: `window.onSpotifyIframeApiReady({ createController(element, options, callback) {
        const frame = document.createElement('iframe');
        frame.src = options.url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        frame.height = String(options.height);
        element.replaceWith(frame);
        let listener;
        window.__spotifyTestPlayback = data => listener?.({ data });
        callback({ addListener(event, handler) { listener = handler }, destroy() { listener = undefined; frame.remove() } });
      } });`,
    }))
    await page.goto('/')
    await expect(page.locator('.room-page')).toHaveAttribute('data-ready', 'true')
    const shelf = page.locator('.object-link[data-object-id="speakers"]')
    await shelf.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Music shelf' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('.modal')).toHaveCount(0)
    await expect(page.locator('iframe')).toHaveCount(0)
    const library = page.locator('.monitor-panel--library'), preview = page.locator('.monitor-panel--preview')
    if (!mobile) {
      await expect(library).toHaveClass(/monitor-panel--ready/)
      await expect(page.locator('.monitor-panels')).toHaveCSS('clip-path', /path\(evenodd/)
      // The panels follow the camera move; measure once it has settled side by side.
      await expect.poll(async () => {
        const a = await library.boundingBox(), b = await preview.boundingBox()
        return Boolean(a && b && a.x + a.width <= b.x + 2 && Math.abs(a.y - b.y) < 20)
      }, { timeout: 5000 }).toBe(true)
    }
    await page.getByRole('button', { name: 'Load player: Light', exact: true }).click()
    await expect(preview.locator('iframe')).toHaveCount(1)
    await expect(preview.locator('iframe')).toHaveAttribute('height', '352')
    await expect(preview.locator('iframe')).toHaveAttribute('src', /embed\/playlist\/6RgbkiGSEMtH5lYyGfrggE/)
    await page.getByRole('button', { name: 'Load player: Light', exact: true }).click()
    await expect(page.locator('iframe')).toHaveCount(1)
    await expect(preview.locator('iframe')).toHaveAttribute('title', /Light/)
    await page.getByRole('button', { name: 'Reload preview', exact: true }).click()
    await expect(preview.locator('iframe')).toHaveAttribute('title', /Light/)
    await expect(preview.locator('iframe')).toHaveCount(1)
    await expect(page.locator('.room-scene')).toHaveAttribute('data-music-playing', 'false')
    await page.evaluate(() => {
      (window as unknown as { __spotifyTestPlayback: (data: unknown) => void }).__spotifyTestPlayback({
        playingURI: 'spotify:track:69kOkLUCkxIZYexIgSG8rq', isPaused: false, isBuffering: false, position: 1000, duration: 30000,
      })
    })
    await expect(page.locator('.room-scene')).toHaveAttribute('data-music-playing', 'true')
    await dialog.getByRole('button', { name: /back to the room/i }).click()
    await expect(dialog).toBeHidden()
    await expect(shelf).toBeFocused()
    await expect(page.locator('iframe')).toHaveCount(1)
    await expect(page.locator('.monitor-music')).toBeVisible()
    await expect(page.locator('.monitor-music')).toHaveAttribute('inert', '')
    await expect(library).toBeVisible()
    await expect(preview).toBeVisible()
    await expect(page.locator('.music-toolbar')).toBeHidden()
    await expect(library).toHaveCSS('pointer-events', 'none')
    await expect(library).toHaveCSS('position', 'absolute')
    await expect(page.locator('.monitor-panels')).toHaveCSS('clip-path', /path\(evenodd/)
    // Keep the same browsing context and player while exploring room content.
    const player = await preview.locator('iframe').elementHandle()
    for (const objectId of ['clock', 'library_about', 'screen_right']) {
      await page.locator(`.object-link[data-object-id="${objectId}"]`).press('Enter')
      await expect(page.locator('.modal')).toBeVisible()
      await expect(page.locator('.room-scene')).toHaveAttribute('data-music-playing', 'true')
      expect(await player!.evaluate(frame => frame.isConnected)).toBe(true)
      await expect(page.locator('iframe')).toHaveCount(1)
      await page.keyboard.press('Escape')
      await expect(page.locator('.modal')).toBeHidden()
      await expect(page.locator('.room-scene')).toHaveAttribute('data-music-playing', 'true')
    }
    await page.evaluate(() => {
      (window as unknown as { __spotifyTestPlayback: (data: unknown) => void }).__spotifyTestPlayback({
        playingURI: 'spotify:track:69kOkLUCkxIZYexIgSG8rq', isPaused: true, isBuffering: false, position: 1500, duration: 30000,
      })
    })
    await expect(page.locator('.room-scene')).toHaveAttribute('data-music-playing', 'false')
    await shelf.press('Enter')
    await expect(dialog.getByRole('button', { name: /back to the room/i })).toBeFocused()
    await page.getByRole('button', { name: 'Stop and clear', exact: true }).click()
    await expect(page.locator('iframe')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(shelf).toBeFocused()
    if (mobile) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  })
}
