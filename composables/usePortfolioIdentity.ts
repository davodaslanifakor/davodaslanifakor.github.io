import { personStructuredData } from '~/content/portfolio'

/** Stable identity ID and server-rendered JSON-LD on every portfolio route. */
export function usePortfolioIdentity() {
  const siteUrl = useRuntimeConfig().public.siteUrl
  useHead({
    script: [{
      key: 'portfolio-person',
      type: 'application/ld+json',
      innerHTML: JSON.stringify(personStructuredData(siteUrl)).replace(/</g, '\\u003c'),
    }],
  })
}
