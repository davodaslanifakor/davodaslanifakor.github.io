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
      routes: ['/', '/cv'],
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
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#171512' },
      ],
    },
  },
})
