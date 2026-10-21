import { defineConfig, devices } from '@playwright/test'

const port = process.env.PORTFOLIO_E2E_PORT ?? '3000'
const baseURL = process.env.PORTFOLIO_E2E_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: process.platform === 'darwin'
      ? ['--use-angle=metal']
      // Keep software rendering limited to WebGL on runners without a GPU.
      : ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: process.env.PORTFOLIO_E2E_STATIC === '1'
      ? `python3 -m http.server ${port} --bind 127.0.0.1 --directory .output/public`
      : process.env.PORTFOLIO_E2E_PRODUCTION === '1' ? `node .output/server/index.mjs` : `pnpm dev --host 127.0.0.1 --port ${port}`,
    env: { PORT: port, HOST: '127.0.0.1' },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
