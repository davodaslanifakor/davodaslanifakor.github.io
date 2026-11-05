import { expect, test } from '@playwright/test'

test('visitor analytics respects origin, consent, navigation and withdrawal @pages', async ({ page, baseURL }) => {
  const requests: string[] = []
  // For the dedicated consent run, configure the local fixture as the allowed origin.
  // The ordinary @pages run keeps the real origin and verifies preview traffic stays off.
  if (process.env.PORTFOLIO_ANALYTICS_E2E === '1') {
    await page.route(/\/(studio|cv)\/?(?:\?.*)?$/, async route => {
      const response = await route.fetch()
      const body = (await response.text()).replace(/siteUrl:"[^"]*"/g, `siteUrl:${JSON.stringify(new URL(baseURL!).origin)}`)
      await route.fulfill({ response, body })
    })
  }
  page.on('request', request => {
    if (/googletagmanager\.com|google-analytics\.com/.test(request.url())) requests.push(request.url())
  })
  // Keep test visits out of Google while exercising the real script loader and data layer.
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }))
  const response = await page.goto('/studio')
  await expect(page.locator('.studio-page')).toBeVisible()
  const configuredOrigin = (await response!.text()).match(/siteUrl:"([^"]*)"/)![1]!
  if (process.env.PORTFOLIO_ANALYTICS_E2E === '1') expect(new URL(configuredOrigin).origin).toBe(new URL(baseURL!).origin)
  if (new URL(configuredOrigin).origin !== new URL(baseURL!).origin) {
    await expect(page.getByRole('button', { name: 'Accept analytics', exact: true })).toHaveCount(0)
    expect(requests).toHaveLength(0)
    return
  }
  const banner = page.getByRole('complementary', { name: 'Visitor analytics' })
  await expect(banner).toBeVisible()
  expect(requests).toHaveLength(0)
  await banner.getByRole('button', { name: 'Reject analytics', exact: true }).click()
  await page.reload()
  await expect(banner).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await page.getByRole('button', { name: 'Analytics settings', exact: true }).click()
  await banner.getByRole('button', { name: 'Accept analytics', exact: true }).click()
  await expect.poll(() => requests.length).toBe(1)
  const views = () => page.evaluate(() => ((window as unknown as { dataLayer?: { event?: string; page_location?: string; page_title?: string }[] }).dataLayer ?? []).filter(event => event.event === 'portfolio_page_view'))
  await expect.poll(async () => (await views()).length).toBe(1)
  await page.locator('a[href="/cv"]').first().click()
  await expect(page.locator('.cv-page')).toBeVisible()
  await expect.poll(async () => (await views()).length).toBe(2)
  expect((await views())[1]!.page_title).toBe(await page.title())
  await page.goBack()
  await expect(page.locator('.studio-page')).toBeVisible()
  await expect.poll(async () => (await views()).length).toBe(3)
  expect(requests).toHaveLength(1)
  const oldDocument = await page.locator('html').elementHandle()
  await page.getByRole('button', { name: 'Analytics settings', exact: true }).click()
  await banner.getByRole('button', { name: 'Reject analytics', exact: true }).click()
  await expect.poll(async () => {
    try { return await oldDocument!.evaluate(element => element.isConnected) } catch { return false }
  }).toBe(false)
  await expect(page.getByRole('button', { name: 'Analytics settings', exact: true })).toBeVisible()
  expect(await views()).toHaveLength(0)
  expect(requests).toHaveLength(1)
})
