export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2026-09-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      siteUrl: 'https://davodaslanifakor.github.io',
    },
  },
  nitro: {
    prerender: {
      routes: ['/', '/cv', '/studio', '/studio/motion'],
      crawlLinks: true,
      failOnError: true,
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@tresjs/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    $client: {
      build: {
        rolldownOptions: {
          output: {
            // Keep lazy page modules isolated from the 3D entry. Server output
            // retains Nuxt's default module format for its SSR renderer.
            strictExecutionOrder: true,
          },
        },
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  pinia: {
    storesDirs: ['./stores/**'],
  },
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [
      { code: 'en', language: 'en-US', dir: 'ltr', name: 'English' },
      { code: 'fa', language: 'fa-IR', dir: 'rtl', name: 'فارسی' },
    ],
    vueI18n: './i18n.config.ts',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en', dir: 'ltr' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#171512' },
      ],
    },
  },
})
