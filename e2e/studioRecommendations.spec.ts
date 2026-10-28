import { expect, test } from '@playwright/test'

// Functional checks cover scroll/reverse/controls and the readable fallbacks.
test('recommendations follow the wheel timeline and release into writing @pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/studio/')
  const section = page.locator('#recommendations')
  await expect(section).toHaveAttribute('data-layout', 'wheel')
  const position = await section.evaluate(el => el.getBoundingClientRect().top + window.scrollY - 68)
  await page.evaluate(top => window.scrollTo(0, top), position)
  const next = section.getByRole('button', { name: 'Next recommendation', exact: true })
  const previous = section.getByRole('button', { name: 'Previous recommendation', exact: true })
  await expect(previous).toBeDisabled()
  await next.click()
  await expect(section.getByRole('status')).toHaveText('02 / 13')
  await expect(section.locator('[data-recommendation="erhan-kaya"]')).toHaveAttribute('aria-hidden', 'false')
  await expect(section.locator('[data-recommendation="mojtaba-niknam"]')).toHaveAttribute('inert', '')
  // Perspective and z recession keep the wheel volumetric, while the front stays sharp.
  await expect(section.locator('.recommendation-track')).toHaveCSS('perspective', '1100px')
  // ScrollTrigger may settle a few millionths of a pixel off the snap point.
  await expect.poll(() => section.locator('[data-recommendation="erhan-kaya"]').evaluate(el => Number.parseFloat(getComputedStyle(el).filter.replace('blur(', '')))).toBeLessThan(0.01)
  const rear = section.locator('[data-recommendation="mojtaba-niknam"]')
  await expect(rear).toHaveCSS('transform', /matrix3d/)
  await expect(rear).not.toHaveCSS('filter', 'blur(0px)')
  // Real native scroll advances without clicking a control.
  await page.mouse.move(1000, 450)
  await page.mouse.wheel(0, 500)
  await expect(section.getByRole('status')).toHaveText('03 / 13')
  await previous.click()
  await expect(section.getByRole('status')).toHaveText('02 / 13')
  await section.getByRole('link', { name: 'Continue to writing', exact: true }).click()
  await expect(page.locator('#writing h2')).toBeInViewport()
  await expect(page).toHaveURL(/#writing$/)
})

test('recommendation cards support mobile swipe, keyboard controls and list mode @pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/studio/')
  const section = page.locator('#recommendations')
  await expect(section).toHaveAttribute('data-layout', 'slider')
  const next = section.getByRole('button', { name: 'Next recommendation', exact: true })
  await next.focus()
  await next.press('Enter')
  await expect(section.getByRole('status')).toHaveText('02 / 13')
  await expect.poll(() => section.locator('.recommendation-track').evaluate(el => el.scrollLeft)).toBeGreaterThan(300)
  await section.getByRole('button', { name: 'Read as a list', exact: true }).click()
  await expect(section).toHaveAttribute('data-layout', 'list')
  await expect(section.locator('.recommendation-card')).toHaveCount(13)
  await expect(section.locator('[inert]')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

test('reduced motion and live preference changes expose the full reading list @pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/studio/')
  const section = page.locator('#recommendations')
  await expect(section).toHaveAttribute('data-layout', 'wheel')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(section).toHaveAttribute('data-layout', 'list')
  await expect(section.locator('[inert]')).toHaveCount(0)
  await expect(section.locator('.recommendation-card').first()).toHaveCSS('filter', 'none')
  await expect(section.locator('.recommendation-card').last()).toContainText('Vahid Ebrahimirad')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(section).toHaveAttribute('data-layout', 'wheel')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(section).toHaveAttribute('data-layout', 'slider')
  await expect(section.locator('[inert]')).toHaveCount(0)
})

test('recommendations remain complete without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/studio/')
  const section = page.locator('#recommendations')
  await expect(section).toHaveAttribute('data-layout', 'list')
  await expect(section.locator('.recommendation-card')).toHaveCount(13)
  await expect(section.locator('.recommendation-card').last()).toBeVisible()
  await expect(section.getByRole('link', { name: 'All recommendations on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/davoud-fakour/details/recommendations/?detailScreenTabIndex=0')
  await context.close()
})

test('reviewer avatars are local, load correctly and fall back on failure @pages', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/studio/')
  const section = page.locator('#recommendations')
  const photos = section.locator('.recommendation-avatar img')
  await expect(photos).toHaveCount(13)
  const sources = await photos.evaluateAll(images => images.map(image => image.getAttribute('src')!))
  for (const src of sources) {
    expect(src).toMatch(/^\/images\/recommendations\/[a-z-]+\.jpg$/)
    const response = await page.request.get(src)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/jpeg')
  }
  const first = section.locator('[data-recommendation="mojtaba-niknam"]')
  await first.scrollIntoViewIfNeeded()
  await expect.poll(() => first.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(100)
  // A fresh context avoids WebKit reusing the successfully decoded image.
  const failedContext = await browser.newContext({ reducedMotion: 'reduce' })
  await failedContext.route('**/images/recommendations/*.jpg', route => route.abort())
  // Force the image to fail before hydration, as on slower publishing runners.
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve })
  await failedContext.route('**/_nuxt/*.js', async route => { await scriptsReady; await route.continue() })
  const failedPage = await failedContext.newPage()
  await failedPage.goto('/studio/', { waitUntil: 'commit' })
  const failedCard = failedPage.locator('[data-recommendation="mojtaba-niknam"]')
  await failedCard.scrollIntoViewIfNeeded()
  await expect.poll(() => failedCard.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0)).toBe(true)
  releaseScripts()
  await expect(failedCard.locator('img')).toHaveCount(0)
  await expect(failedCard.locator('.recommendation-avatar')).toHaveText('MN')
  await expect(failedCard.getByRole('link', { name: 'Mojtaba Niknam' })).toBeVisible()
  await failedContext.close()
})

test('the last recommendation hands directly into writing without exposing earlier work @pages', async ({ page }) => {
  await page.setViewportSize({ width: 1896, height: 1000 })
  await page.goto('/studio/')
  const section = page.locator('#recommendations')
  await expect(section).toHaveAttribute('data-layout', 'wheel')
  // Reproduce the exit boundary in the user's screenshot: rail ends at y=220.
  await section.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.clientHeight - 220))
  await expect(section.getByRole('status')).toHaveText('13 / 13')
  await expect.poll(() => page.evaluate(() => {
    const recommendations = document.querySelector('#recommendations')!.getBoundingClientRect()
    const writing = document.querySelector('#writing')!.getBoundingClientRect()
    return Math.round(writing.top - recommendations.bottom)
  })).toBeLessThanOrEqual(1)
  // The following chapter, not the old sticky Work layer, owns the seam.
  const chapterAtSeam = await page.evaluate(() => {
    const bottom = document.querySelector('#recommendations')!.getBoundingClientRect().bottom
    return document.elementFromPoint(innerWidth / 2, bottom + 8)?.closest('section')?.id
  })
  expect(chapterAtSeam).toBe('writing')
})
