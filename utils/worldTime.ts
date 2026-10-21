import type { ScreenCity } from '~/content/portfolio'

export interface ZonedTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()
const localizedFormatters = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string) {
  let cached = formatters.get(timeZone)
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    formatters.set(timeZone, cached)
  }
  return cached
}

export function getZonedTimeParts(epochMs: number, timeZone: string): ZonedTimeParts {
  const values = Object.fromEntries(formatter(timeZone).formatToParts(epochMs)
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, Number(part.value)]))
  return {
    year: values.year!, month: values.month!, day: values.day!,
    hour: values.hour!, minute: values.minute!, second: values.second!,
  }
}

export function getWorldClockReading(epochMs: number, city: ScreenCity, locale: 'en' | 'fa') {
  const parts = getZonedTimeParts(epochMs, city.timeZone)
  const key = `${locale}:${city.timeZone}`
  let visibleFormatter = localizedFormatters.get(key)
  if (!visibleFormatter) {
    visibleFormatter = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-GB-u-ca-gregory', {
      timeZone: city.timeZone, year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
    localizedFormatters.set(key, visibleFormatter)
  }
  const localized = visibleFormatter.formatToParts(epochMs)
  const value = (type: string) => localized.find(part => part.type === type)?.value ?? ''
  return {
    parts,
    time: `${value('hour')}:${value('minute')}`,
    date: `${value('day')} ${value('month')} ${value('year')}`,
  }
}

export function getHandAngles(epochMs: number, timeZone: string) {
  const { hour, minute, second } = getZonedTimeParts(epochMs, timeZone)
  return {
    hour: 30 * ((hour % 12) + minute / 60 + second / 3600),
    minute: 6 * (minute + second / 60),
    second: 6 * second,
  }
}
