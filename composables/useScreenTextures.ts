import { onScopeDispose, shallowRef, watch } from 'vue'
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three'
import { screenContent, profile, caseStudies, localize, ui } from '~/content/portfolio'
import type { MusicTrack, Locale } from '~/content/portfolio'
import { getZonedTimeParts } from '~/utils/worldTime'
import { SCREEN_THEMES } from '~/utils/screenTheme'
import type { ScreenPalette, ScreenTheme, ScreenThemeId } from '~/utils/screenTheme'

/** Local canvas artwork: one shared ultrawide and a separate laptop fallback.
 * Native-resolution surfaces add no network image bytes; their GPU memory is accounted in
 * ROOM_STYLE_REVIEW.md. Screen copy comes from the portfolio content catalog.
 */

const SCALE = 4

interface Surface {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  palette: ScreenPalette
}

function createSurface(width: number, height: number, palette: ScreenPalette): Surface | null {
  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(SCALE, SCALE)
  ctx.imageSmoothingEnabled = true
  ctx.fillStyle = palette.base
  ctx.fillRect(0, 0, width, height)
  return { ctx, width, height, palette }
}

/** Use native artwork directly, copying 1:1 when retaining an existing texture. */
function toTexture(surface: Surface, existing?: CanvasTexture): CanvasTexture {
  const source = surface.ctx.canvas
  const target = existing?.image instanceof HTMLCanvasElement ? existing.image : source
  if (target !== source) {
    // Reset the previous drawing transform before copying native pixels.
    target.width = source.width
    target.height = source.height
    const ctx = target.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(source, 0, 0)
  }

  if (existing) {
    existing.needsUpdate = true
    return existing
  }
  const texture = new CanvasTexture(target)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  // glTF UVs have their origin at the top-left and Blender's exporter already
  // flips V on the way out, so the usual CanvasTexture flip would undo it and
  // land the art upside down.
  texture.flipY = false
  return texture
}

function screenFont(ctx: CanvasRenderingContext2D, size: number, weight = 400) {
  // Font sizes stay in logical units; the scaled context rasterizes native detail.
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  ctx.textBaseline = 'top'
}

function menuBar(s: Surface, items: readonly string[]) {
  const { ctx, palette, width } = s
  ctx.fillStyle = palette.ink
  ctx.fillRect(0, 0, width, 9)
  ctx.fillStyle = palette.base
  screenFont(ctx, 6)
  let x = 4
  for (const item of items) {
    ctx.fillText(item, x, 2)
    x += ctx.measureText(item).width + 5
  }
  ctx.fillRect(width - 16, 3, 3, 3)
  ctx.fillRect(width - 10, 3, 6, 3)
}

function panel(s: Surface, x: number, y: number, w: number, h: number) {
  const { ctx, palette } = s
  ctx.save()
  ctx.globalAlpha = 0.88
  ctx.fillStyle = palette.base
  ctx.fillRect(x, y, w, h)
  ctx.globalAlpha = 0.28
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 0.5
  ctx.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5)
  ctx.restore()
}

/** The same normalized mountain shapes and lighting on both aspect ratios. */
function wallpaper(s: Surface) {
  const { ctx, palette, width, height } = s
  for (const [layer, color] of palette.landscape.entries()) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let step = 0; step <= 24; step++) {
      const x = step / 24
      const ridge = 0.48 + layer * 0.17 + Math.sin(x * 6.5 + layer * 2) * 0.11 + Math.cos(x * 12.6 + layer) * 0.055
      ctx.lineTo(x * width, ridge * height)
    }
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
  }
}

let grain: HTMLCanvasElement | undefined
function grainTile(): HTMLCanvasElement | undefined {
  if (grain) return grain
  const tile = document.createElement('canvas')
  tile.width = tile.height = 128
  const ctx = tile.getContext('2d')
  if (!ctx) return
  const pixels = ctx.createImageData(128, 128)
  let seed = 0x51a7e
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    const value = seed & 1 ? 255 : 0
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value
    pixels.data[i + 3] = (seed >>> 8) % 15
  }
  ctx.putImageData(pixels, 0, 0)
  grain = tile
  return grain
}

/** Fixed grain never shimmers; soft edge shading seats the art behind glass. */
function glass(s: Surface) {
  const { ctx, palette, width, height } = s
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.scale(width / 2, height / 2)
  const vignette = ctx.createRadialGradient(0, -0.1, 0.25, 0, 0, 1.35)
  vignette.addColorStop(0, `${palette.base}00`)
  vignette.addColorStop(1, `${palette.base}55`)
  ctx.fillStyle = vignette
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()

  const glow = ctx.createLinearGradient(0, 0, 0, height)
  glow.addColorStop(0, `${palette.accent}24`)
  glow.addColorStop(0.4, `${palette.accent}00`)
  glow.addColorStop(1, `${palette.accent}08`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
  const tile = grainTile()
  const pattern = tile && ctx.createPattern(tile, 'repeat')
  if (pattern) {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, width * SCALE, height * SCALE)
    ctx.restore()
  }
  ctx.strokeStyle = `${palette.accent}35`
  ctx.lineWidth = 0.5
  ctx.strokeRect(0.75, 0.75, width - 1.5, height - 1.5)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) {
  let line = '', row = 0
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) {
      ctx.fillText(line, x, y + row++ * lineHeight)
      line = word
    } else line = next
  }
  ctx.fillText(line, x, y + row * lineHeight)
}

interface UltrawideOptions {
  track?: MusicTrack | null
  locale?: Locale
  time?: number
  now?: Date
  theme?: ScreenTheme
}

/** One full-width composition; both curved click surfaces share these pixels. */
export function drawUltrawideScreen({ track = null, locale = 'en', time = 0, now = new Date(), theme = SCREEN_THEMES.slate }: UltrawideOptions = {}, existing?: CanvasTexture): CanvasTexture | null {
  const s = createSurface(512, 144, theme)
  if (!s) return null
  const { ctx, palette } = s
  wallpaper(s)

  ctx.fillStyle = palette.ink
  screenFont(ctx, 24, 600)
  ctx.fillText(profile.name, 20, 19)
  screenFont(ctx, 11)
  wrapText(ctx, localize(profile.role, locale), 20, 53, 225, 15)
  ctx.fillStyle = palette.accent
  screenFont(ctx, 9)
  ctx.fillText(profile.specialties, 20, 88)

  panel(s, 20, 113, 112, 18)
  ctx.fillStyle = palette.ink
  screenFont(ctx, 9, 500)
  const homeTime = cityTime('Europe/Istanbul', now)
  ctx.fillText(`${localize(screenContent.homeCity, locale)} ${homeTime}`, 29, 117)

  // Playback replaces the case area, keeping the identity and local time visible.
  if (track) {
    panel(s, 270, 15, 222, 116)
    ctx.fillStyle = palette.accent
    screenFont(ctx, 9)
    ctx.fillText(localize(ui.musicNowPlaying, locale), 282, 27, 198)
    ctx.fillStyle = palette.ink
    screenFont(ctx, 13, 500)
    ctx.fillText(track.title, 282, 48, 198)
    screenFont(ctx, 10)
    ctx.fillText(track.artist, 282, 69, 198)
    ctx.fillStyle = palette.accent
    for (let index = 0; index < 12; index++) {
      const height = 6 + (Math.sin(time * Math.PI * 2 / 750 + index * 0.8) + 1) * 7
      ctx.fillRect(282 + index * 16, 119 - height, 6, height)
    }
  } else {
    ctx.fillStyle = palette.accent
    screenFont(ctx, 9, 500)
    ctx.fillText(localize(ui.selectedWork, locale), 270, 19)
    for (const [index, study] of caseStudies.slice(0, 2).entries()) {
      const x = 270 + index * 117
      panel(s, x, 38, 105, 93)
      ctx.fillStyle = palette.ink
      screenFont(ctx, 10, 500)
      wrapText(ctx, localize(study.title, locale), x + 12, 50, 81, 13)
      ctx.fillStyle = palette.accent
      screenFont(ctx, 8)
      ctx.fillText(String(index + 1).padStart(2, '0'), x + 12, 112)
    }
  }
  glass(s)
  return toTexture(s, existing)
}

function cityTime(timeZone: string, now: Date): string {
  const parts = getZonedTimeParts(now.getTime(), timeZone)
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
}

function analogClock(s: Surface, cx: number, cy: number, r: number, time: string) {
  const { ctx, palette } = s
  ctx.save()
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  for (let a = 0; a < 360; a += 30) {
    const rad = a * Math.PI / 180
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(rad) * (r - 1.2), cy + Math.sin(rad) * (r - 1.2))
    ctx.lineTo(cx + Math.cos(rad) * (r - 0.5), cy + Math.sin(rad) * (r - 0.5))
    ctx.stroke()
  }

  const [hours, minutes] = time.split(':').map(Number)
  const hourAngle = (((hours ?? 0) % 12 + (minutes ?? 0) / 60) / 12) * Math.PI * 2 - Math.PI / 2
  const minuteAngle = ((minutes ?? 0) / 60) * Math.PI * 2 - Math.PI / 2
  ctx.strokeStyle = palette.ink
  ctx.lineWidth = 0.8
  ctx.lineCap = 'round'
  for (const [angle, length] of [[hourAngle, r * 0.5], [minuteAngle, r * 0.78]] as const) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawLaptopScreen(now = new Date(), existing?: CanvasTexture, theme: ScreenTheme = SCREEN_THEMES.slate): CanvasTexture | null {
  const s = createSurface(240, 158, theme)
  if (!s) return null
  const { ctx, palette } = s

  wallpaper(s)
  menuBar(s, screenContent.laptopMenu)

  // World clocks: this is where the plan puts the location claim.
  panel(s, 128, 18, 104, 34)
  let x = 134
  for (const city of screenContent.cities) {
    const time = cityTime(city.timeZone, now)
    analogClock(s, x + 10.5, 30, 8, time)
    ctx.save()
    ctx.fillStyle = palette.ink
    screenFont(ctx, 5)
    ctx.textAlign = 'center'
    ctx.fillText(city.label, x + 10.5, 43, 22)
    ctx.restore()
    x += 23
  }

  // Calendar card with the day picked out large.
  panel(s, 128, 58, 60, 44)
  ctx.fillStyle = palette.ink
  screenFont(ctx, 6)
  const calendar = getZonedTimeParts(now.getTime(), 'Europe/Istanbul')
  const monthName = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Istanbul', month: 'short' }).format(now).toUpperCase()
  ctx.fillText(monthName, 132, 62)
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      ctx.fillRect(133 + col * 8, 72 + row * 7, 5, 4)
    }
  }

  panel(s, 192, 58, 40, 44)
  ctx.fillStyle = palette.ink
  screenFont(ctx, 6)
  ctx.fillText(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Istanbul', weekday: 'short' }).format(now), 197, 63)
  ctx.fillStyle = palette.accent
  screenFont(ctx, 20, 500)
  ctx.fillText(String(calendar.day), 197, 74)

  // Left side: a keyboard sketch, echoing the reference wallpaper.
  panel(s, 14, 92, 100, 46)
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      ctx.fillStyle = palette.ink
      ctx.fillRect(19 + col * 8.5, 97 + row * 10, 6, 6)
    }
  }

  ctx.fillStyle = palette.ink
  screenFont(ctx, 16)
  ctx.fillText(
    `${String(calendar.month).padStart(2, '0')}/${String(calendar.day).padStart(2, '0')}`,
    16,
    62,
  )
  glass(s)
  return toTexture(s, existing)
}

interface ScreenTextureOptions {
  theme?: () => ScreenThemeId
  locale?: () => Locale
}

/** Owns only the two screen textures. Repaints retain material and UV bindings. */
export function useScreenTextures(options: ScreenTextureOptions = {}) {
  const textures = shallowRef<Map<string, CanvasTexture>>(new Map())
  const theme = () => SCREEN_THEMES[options.theme?.() ?? 'slate']
  let clock = new Date()
  let music: Pick<UltrawideOptions, 'track' | 'locale' | 'time'> = {}
  const locale = () => options.locale?.() ?? music.locale ?? 'en'
  let lastMusicKey = ''
  let lastMusicFrame = -Infinity

  function build(now = clock) {
    clock = now
    const next = new Map<string, CanvasTexture>()
    const ultrawide = drawUltrawideScreen({ ...music, locale: locale(), now, theme: theme() }, textures.value.get('int_screen_left'))
    const laptop = drawLaptopScreen(now, textures.value.get('int_monitor_screen'), theme())
    if (ultrawide) {
      next.set('int_screen_left', ultrawide)
      next.set('int_screen_right', ultrawide)
    }
    if (laptop) next.set('int_monitor_screen', laptop)
    textures.value = next
  }

  function updateMusic(track: MusicTrack | null, activeLocale: Locale, time: number, reducedMotion: boolean) {
    music = { track, locale: activeLocale, time: reducedMotion ? 0 : time }
    const texture = textures.value.get('int_screen_left')
    if (!texture) return
    const key = `${track?.id ?? ''}:${activeLocale}:${reducedMotion}`
    if (key === lastMusicKey && (!track || reducedMotion || time - lastMusicFrame < 100)) return
    lastMusicKey = key
    lastMusicFrame = time
    drawUltrawideScreen({ ...music, now: clock, theme: theme() }, texture)
  }

  // The room's existing minute/visibility clock refreshes both screens, including
  // under reduced motion. No screen-local timers or animation loops are needed.
  function updateTime(now: Date) { build(now) }

  watch([theme, locale], () => {
    if (textures.value.size) build()
  })
  onScopeDispose(() => {
    for (const texture of new Set(textures.value.values())) texture.dispose()
  })

  return { textures, build, updateTime, updateMusic }
}
