import { expect, test } from '@playwright/test'

for (const route of ['/', '/cv/', '/studio/', '/studio/motion/']) {
  test(`portfolio icons and manifest are available on ${route}`, { tag: '@pages' }, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json')
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg')
    for (const path of ['/favicon.svg','/favicon.ico','/favicon-32x32.png','/apple-touch-icon.png'])
      expect((await page.request.get(path)).ok()).toBe(true)
    const response=await page.request.get('/manifest.json')
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('json')
    const manifest=await response.json()
    expect(manifest.name).toContain('Davoud Aslani Fakour')
    expect(manifest.start_url).toBe('/studio/')
    for (const icon of manifest.icons) {
      const asset=await page.request.get(icon.src)
      expect(asset.ok()).toBe(true)
      expect(asset.headers()['content-type']).toContain('image/png')
    }
  })
}

test('Email opens usable options and reports clipboard failure clearly', { tag: '@pages' }, async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.addInitScript(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}}))
  await page.goto('/studio/')
  const email=page.locator('#contact .contact-email')
  await email.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(email).toHaveAttribute('open','')
  await expect(email.getByText('davodaslanifakor@gmail.com',{exact:true})).toBeVisible()
  await expect(email.getByRole('link',{name:'Open email app',exact:true})).toHaveAttribute('href','mailto:davodaslanifakor@gmail.com')
  await expect(email.getByRole('link',{name:'Write in Gmail',exact:true})).toHaveAttribute('href',/mail\.google\.com.*to=davodaslanifakor%40gmail\.com/)
  await email.getByRole('button',{name:'Copy email address',exact:true}).click()
  await expect(email.getByRole('status')).toHaveText('Select the email address above to copy it.')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  if(testInfo.project.name==='chromium') await email.screenshot({path:'docs/renders/studio-projects/email-options.png'})
})

test('Email options also work without JavaScript', async ({ browser, baseURL }) => {
  const context=await browser.newContext({javaScriptEnabled:false,...(baseURL?{baseURL}:{})})
  try {
    const page=await context.newPage()
    await page.goto('/cv/')
    const email=page.locator('#contact .contact-email')
    await email.locator('summary').click()
    await expect(email.getByRole('link',{name:'Write in Gmail',exact:true})).toBeVisible()
    await expect(email.getByText('davodaslanifakor@gmail.com',{exact:true})).toBeVisible()
  } finally {await context.close()}
})
