import type { AnalyticsChoice } from '~/utils/visitorAnalytics'

/** Site-wide preference, independent of the room and its 3D state. */
export function useAnalyticsConsent() {
  const choice = useState<AnalyticsChoice | null>('analytics-choice', () => null)
  const ready = useState('analytics-ready', () => false)
  const enabled = useState('analytics-enabled', () => false)
  return { choice, ready, enabled }
}
