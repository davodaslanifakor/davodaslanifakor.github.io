import { expect, test, type Page } from '@playwright/test'

async function openDesktop(page: Page, hash = '') {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`/studio/${hash}`)
  await expect(page.locator('#career')).toHaveAttribute(
    'data-layout',
    'horizontal',
  )
  await expect(page.locator('.studio-career-frame').locator('..')).toHaveClass(
    /pin-spacer/,
  )
}
async function geometry(page: Page) {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('.studio-career-frame')!
    const viewport = document.querySelector<HTMLElement>(
      '.studio-career-viewport',
    )!
    const track = document.querySelector<HTMLElement>('.studio-career-track')!
    const spacer = frame.parentElement!
    const top =
      68 +
      document.querySelector<HTMLElement>('.studio-career-controls')!
        .offsetHeight
    return {
      start: spacer.getBoundingClientRect().top + scrollY - top,
      travel: track.scrollWidth - viewport.clientWidth,
      top,
    }
  })
}
async function scroll(page: Page, top: number) {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    top,
  )
}
async function translation(page: Page) {
  return page
    .locator('.studio-career-track')
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
}
async function fullyInView(page: Page, selector: string) {
  await expect
    .poll(() =>
      page.locator(selector).evaluate((el) => {
        const r = el.getBoundingClientRect()
        return (
          r.left >= -1 &&
          r.right <= innerWidth + 1 &&
          r.top >= 68 &&
          r.bottom <= innerHeight + 1
        )
      }),
    )
    .toBe(true)
}

test('hero overlaps, measured career travels in both directions, then releases', async ({
  page,
}) => {
  await openDesktop(page)
  await page.mouse.wheel(0, 200)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(200)
  await expect
    .poll(() =>
      page
        .locator('.studio-hero')
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBe(0)
  expect(
    await page
      .locator('#career')
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeLessThan(1000)
  expect(
    await page
      .locator('#career')
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeGreaterThan(600)
  const g = await geometry(page)
  expect(g.travel).toBeGreaterThan(2000)
  expect(g.travel).toBeLessThan(5000)
  await scroll(page, g.start + g.travel / 2)
  await expect.poll(() => translation(page)).toBeCloseTo(-g.travel / 2, 0)
  await expect
    .poll(() =>
      page
        .locator('.studio-career-frame')
        .evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeCloseTo(g.top, 0)
  expect(
    await page
      .locator('.studio-navigation')
      .evaluate((el) => !!el.closest('.pin-spacer')),
  ).toBe(false)
  expect(
    await page
      .locator('.studio-career-index')
      .evaluate((el) => !!el.closest('.pin-spacer')),
  ).toBe(false)
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Switch to dark mode', exact: true })).toBeEnabled()
  await expect.poll(() => translation(page)).toBeCloseTo(-g.travel / 2, 0)
  await scroll(page, g.start + g.travel)
  await expect.poll(() => translation(page)).toBeCloseTo(-g.travel, 0)
  await fullyInView(page, '#career-pay')
  // Released: the last chapter holds while the work chapter slides over it.
  await scroll(page, g.start + g.travel + 240)
  const workTop = await page
    .locator('#work')
    .evaluate((el) => el.getBoundingClientRect().top)
  await scroll(page, g.start + g.travel + 480)
  await expect
    .poll(() =>
      page.locator('#work').evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeCloseTo(workTop - 240, 0)
  expect(
    await page
      .locator('.studio-career-frame')
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeGreaterThan(g.top - 60)
  await scroll(page, g.start + g.travel / 4)
  await expect.poll(() => translation(page)).toBeCloseTo(-g.travel / 4, 0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    1440,
  )
})

test('chapter index, native focus, skip, direct hashes and Back reveal the destination', async ({
  page,
}) => {
  await openDesktop(page)
  await page.locator('.studio-career-index a').nth(3).click()
  await expect(page.locator('#career-ostadbank')).toBeFocused()
  await fullyInView(page, '#career-ostadbank')
  await page.keyboard.press('Tab')
  await expect(page.locator('#career-ostadbank a')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#career-pay a')).toBeFocused()
  await fullyInView(page, '#career-pay a')
  await page.keyboard.press('Shift+Tab')
  await fullyInView(page, '#career-ostadbank a')
  await page.getByRole('link', { name: 'Skip career', exact: true }).click()
  await expect
    .poll(() =>
      page.locator('#work').evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeLessThan(150)
  await page.goBack()
  await fullyInView(page, '#career-ostadbank')
  await page.goto('/studio/#career-sarmayex')
  await expect(page.locator('#career')).toHaveAttribute(
    'data-layout',
    'horizontal',
  )
  await fullyInView(page, '#career-sarmayex')
})

test('resize and reduced motion revert pins and restore the same vertical content', async ({
  page,
}) => {
  await openDesktop(page)
  const g = await geometry(page)
  await scroll(page, g.start + g.travel / 2)
  await page.setViewportSize({ width: 1440, height: 640 })
  await expect(page.locator('#career')).not.toHaveAttribute('data-layout')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  const list = page.locator('[data-career-chapter]')
  await expect(list).toHaveCount(5)
  const tops = await list.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().top),
  )
  expect(tops.every((top, i) => i === 0 || top > tops[i - 1]!)).toBe(true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.locator('#career')).toHaveAttribute(
    'data-layout',
    'horizontal',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('.studio-career-track')).toHaveCSS(
    'transform',
    'none',
  )
  await expect(page.locator('#career')).not.toHaveAttribute('data-layout')
  await page.locator('#career-pay a').focus()
  // Let ScrollTrigger’s queued resize refresh run after the focus move.
  await page.waitForTimeout(350)
  await fullyInView(page, '#career-pay a')
})

test('route teardown and re-entry leave no pins, body locks or 3D requests', async ({
  page,
}) => {
  const forbidden: string[] = []
  const errors: string[] = []
  page.on('request', (r) => {
    if (/draco|\.glb|RoomScene|three[.-]/i.test(r.url()))
      forbidden.push(r.url())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await openDesktop(page)
  const g = await geometry(page)
  await scroll(page, g.start + g.travel / 2)
  await page
    .locator('.studio-navigation')
    .getByRole('link', { name: 'Read CV', exact: true })
    .click()
  await expect(page.locator('.cv-page')).toBeVisible()
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveClass(/studio-document/)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await page.goBack()
  await expect(page.locator('#career')).toHaveAttribute(
    'data-layout',
    'horizontal',
  )
  // The hero holds with CSS sticky; only the career rail uses a GSAP pin.
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await page.getByRole('link', { name: 'Skip career', exact: true }).click()
  await page.waitForLoadState('networkidle')
  expect(forbidden).toEqual([])
  expect(errors).toEqual([])
})

test('SSR without JavaScript includes the entire career, evidence, writing and CV', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
    ...(baseURL ? { baseURL } : {}),
  })
  try {
    const page = await context.newPage()
    await page.goto('/studio/')
    await expect(page.locator('.pin-spacer')).toHaveCount(0)
    await expect(page.locator('[data-career-chapter]')).toHaveCount(5)
    const tops = await page
      .locator('[data-career-chapter]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
    expect(tops.every((top, i) => i === 0 || top > tops[i - 1]!)).toBe(true)
    await page
      .locator('.studio-career-index')
      .getByRole('link', { name: 'OstadBank', exact: true })
      .click()
    await fullyInView(page, '#career-ostadbank a')
    await expect(page.locator('#writing article')).toHaveCount(3)
    await expect(page.locator('#writing time').first()).toHaveAttribute(
      'datetime',
      '2026-06-09',
    )
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://davodaslanifakor.github.io/studio/',
    )
    const response = await page.request.get(
      '/studio/Davoud_Aslani_Fakour_Resume.pdf',
    )
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('application/pdf')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(1440)
  } finally {
    await context.close()
  }
})

test('content fit is remeasured inside the desktop media range and after width changes', async ({
  page,
}) => {
  await openDesktop(page)
  const g = await geometry(page)
  await scroll(page, g.start + g.travel / 2)
  // The media query still matches at 800px; the measured content does not fit.
  await page.setViewportSize({ width: 1440, height: 800 })
  await expect(page.locator('#career')).not.toHaveAttribute('data-layout')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await page.setViewportSize({ width: 1280, height: 1000 })
  await expect(page.locator('#career')).toHaveAttribute(
    'data-layout',
    'horizontal',
  )
  const next = await geometry(page)
  expect(next.travel).not.toEqual(g.travel)
  await scroll(page, next.start + next.travel)
  await fullyInView(page, '#career-pay')
  await expect.poll(() => translation(page)).toBeCloseTo(-next.travel, 0)
  await page.goto('/studio/#work')
  await expect(page.locator('#career')).toHaveAttribute(
    'data-layout',
    'horizontal',
  )
  await expect
    .poll(() =>
      page.locator('#work').evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeLessThan(150)
})

test('leaving before motion initialization cannot install a late pin on the CV', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.addInitScript(() => {
    const ready = document.fonts.ready
    Object.defineProperty(document.fonts, 'ready', {
      get: () =>
        ready.then(
          () => new Promise<void>((resolve) => setTimeout(resolve, 900)),
        ),
    })
  })
  await page.goto('/studio/')
  await expect(
    page.getByRole('button', { name: 'Switch to light mode', exact: true }),
  ).toBeEnabled()
  await page
    .locator('.studio-navigation')
    .getByRole('link', { name: 'Read CV', exact: true })
    .click()
  await expect(page.locator('.cv-page')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveClass(/studio-document/)
  expect(await page.evaluate(() => document.body.style.cssText)).toBe('')
})
