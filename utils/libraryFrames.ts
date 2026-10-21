import { BoxGeometry, CanvasTexture, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { CameraFocusPoint } from '~/composables/useCameraRig'
import { localize, sceneObjects } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'

const panels = [
  { id: 'about', x: -1.07, y: 1.66, color: '#7ce8dd' },
  { id: 'story', x: -0.47, y: 1.66, color: '#ff9cc2' },
  { id: 'career', x: 0.13, y: 1.66, color: '#c2a2ff' },
  { id: 'contact', x: 0.73, y: 1.66, color: '#ffc484' },
] as const

export const LIBRARY_FOCUS_POINTS: CameraFocusPoint[] = panels.map(panel => ({
  name: `cam_library_${panel.id}`,
  position: new Vector3(panel.x, panel.y + 0.08, 0.75),
  target: new Vector3(panel.x, panel.y, -0.32),
}))

const FONT_FAMILY = 'Manrope, Vazirmatn, Tahoma, system-ui, sans-serif'
const LAYERS = 12
const MAX_LIFT = 96
const STAGGER_MS = 55
const RISE_MS = 420
const FALL_MS = 280
const FRAME_INTERVAL_MS = 1000 / 30

interface TextUnit { text: string, left: number }

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function shade(hex: string, amount: number) {
  const value = Number.parseInt(hex.slice(1), 16)
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * amount)
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}

/** Damped rise with a small overshoot, settling exactly on 1. */
function rise(progress: number) {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  return 1 - Math.exp(-6 * progress) * Math.cos(9 * progress)
}

/** Runtime wall panels own their finish, artwork and resources independently of the GLB. */
export function createLibraryFrames(model: Object3D, locale: Locale) {
  let currentLocale = locale
  const frames = panels.map((panel) => {
    const object = sceneObjects.find(object => object.id === `library_${panel.id}`)!
    // Matches the face plane's aspect so glyphs are not stretched.
    const canvas = createCanvas(2048, 754)
    const context = canvas.getContext('2d')!
    const background = createCanvas(canvas.width, canvas.height)
    const stamp = createCanvas(canvas.width, canvas.height)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    // Three clamps this to the GPU maximum; sharper at the frames' oblique viewing angles.
    texture.anisotropy = 16
    texture.magFilter = LinearFilter
    texture.minFilter = LinearMipmapLinearFilter
    texture.generateMipmaps = true

    let units: TextUnit[] = []
    let fontSize = 230
    let direction: CanvasDirection = 'ltr'
    const baseline = canvas.height / 2 + 12
    const motion = { hovered: false, changedAt: 0, lastDraw: -Infinity, settled: true, lifts: [] as number[], liftsAtLeave: [] as number[] }

    function setFont(target: CanvasRenderingContext2D) {
      target.font = `700 ${fontSize}px ${FONT_FAMILY}`
      target.textAlign = 'left'
      target.textBaseline = 'middle'
      target.direction = direction
    }

    /** English waves letter by letter; Persian moves word by word so letters stay joined. */
    function layout(label: string, nextLocale: Locale) {
      direction = nextLocale === 'fa' ? 'rtl' : 'ltr'
      const inset = 56
      context.save()
      fontSize = 230
      setFont(context)
      const measured = context.measureText(label).width
      // Labels are only a few screen pixels tall at room distance, so they fill as much of
      // the panel as possible: larger glyphs keep more texels per screen pixel.
      fontSize = 330 * Math.min(1, (canvas.width - inset * 2 - 170) / Math.max(1, measured * 330 / 230))
      setFont(context)
      const total = context.measureText(label).width
      if (direction === 'rtl') {
        const space = context.measureText(' ').width
        let cursor = canvas.width / 2 + total / 2
        units = label.split(' ').map((word) => {
          const left = cursor - context.measureText(word).width
          cursor = left - space
          return { text: word, left }
        })
      }
      else {
        const start = canvas.width / 2 - total / 2
        units = [...label].map((char, index) => ({ text: char, left: start + context.measureText(label.slice(0, index)).width }))
      }
      context.restore()
      motion.lifts = units.map(() => 0)
      motion.liftsAtLeave = units.map(() => 0)
    }

    function paintBackground() {
      const target = background.getContext('2d')!
      const { width, height } = background
      const inset = 56
      target.clearRect(0, 0, width, height)
      const gradient = target.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, '#121b21')
      gradient.addColorStop(1, '#0b1014')
      target.fillStyle = gradient
      target.fillRect(0, 0, width, height)

      // Neon tube: a soft halo pass, then a crisp core and a pale hot centre on top.
      target.save()
      target.beginPath()
      target.roundRect(inset, inset, width - inset * 2, height - inset * 2, 36)
      target.strokeStyle = panel.color
      target.shadowColor = panel.color
      target.shadowBlur = 42
      target.globalAlpha = 0.55
      target.lineWidth = 14
      target.stroke()
      target.shadowBlur = 0
      target.globalAlpha = 1
      target.lineWidth = 6
      target.stroke()
      target.strokeStyle = '#ffffff'
      target.globalAlpha = 0.55
      target.lineWidth = 1.5
      target.stroke()
      target.restore()
    }

    function fillUnits(target: CanvasRenderingContext2D, offsetY = 0) {
      for (const unit of units) target.fillText(unit.text, unit.left, baseline + offsetY)
    }

    /** White letters pressed into the panel: inner shadow on the upper-left walls, a lit lower lip. */
    function paintStamp() {
      const target = stamp.getContext('2d')!
      target.clearRect(0, 0, stamp.width, stamp.height)
      const glyphs = createCanvas(stamp.width, stamp.height)
      const glyphContext = glyphs.getContext('2d')!
      const hole = createCanvas(stamp.width, stamp.height)
      const holeContext = hole.getContext('2d')!

      setFont(glyphContext)
      glyphContext.fillStyle = '#f3f5f7'
      fillUnits(glyphContext)

      setFont(holeContext)
      holeContext.fillStyle = '#000000'
      holeContext.fillRect(0, 0, hole.width, hole.height)
      holeContext.globalCompositeOperation = 'destination-out'
      fillUnits(holeContext)

      // The panel surface (everything except the glyphs) casts its shadow into the recess.
      glyphContext.globalCompositeOperation = 'source-atop'
      glyphContext.shadowColor = 'rgba(0, 0, 0, 0.95)'
      // Wide, soft gradients scale with the type: hairline rims alias once the
      // texture is minified ~10× at room distance, broad shading survives.
      glyphContext.shadowBlur = fontSize * 0.07
      glyphContext.shadowOffsetX = fontSize * 0.03
      glyphContext.shadowOffsetY = fontSize * 0.045
      glyphContext.drawImage(hole, 0, 0)

      setFont(target)
      // Softly lit lower lip around the recess.
      target.save()
      target.fillStyle = '#000000'
      target.shadowColor = 'rgba(255, 255, 255, 0.2)'
      target.shadowBlur = fontSize * 0.03
      target.shadowOffsetX = 10000
      target.shadowOffsetY = fontSize * 0.025
      for (const unit of units) target.fillText(unit.text, unit.left - 10000, baseline)
      target.restore()
      target.drawImage(glyphs, 0, 0)
    }

    function paintLifted(liftScale: number[]) {
      setFont(context)
      units.forEach((unit, index) => {
        const amount = liftScale[index] ?? 0
        if (amount <= 0.001) return
        const lift = MAX_LIFT * amount
        const top = baseline - lift

        // Soft contact shadow that spreads as the glyph climbs.
        context.save()
        context.fillStyle = '#000000'
        context.shadowColor = `rgba(0, 0, 0, ${0.55 * Math.min(1, amount)})`
        context.shadowBlur = 10 + lift * 0.7
        context.shadowOffsetX = 10000 + lift * 0.35
        context.shadowOffsetY = lift * 0.55
        context.fillText(unit.text, unit.left - 10000, baseline)
        context.restore()

        // Stacked layers between the stamp and the lifted face read as depth.
        for (let layer = LAYERS; layer >= 1; layer--) {
          context.fillStyle = shade(panel.color, 0.22 + 0.78 * (1 - layer / LAYERS))
          context.fillText(unit.text, unit.left, top + (lift * layer) / LAYERS)
        }
        context.save()
        context.fillStyle = '#ffffff'
        context.shadowColor = panel.color
        context.shadowBlur = 28 * amount
        context.fillText(unit.text, unit.left, top)
        context.restore()
      })
    }

    function render() {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(background, 0, 0)
      const strongest = Math.max(0, ...motion.lifts)
      context.globalAlpha = 1 - 0.45 * Math.min(1, strongest)
      context.drawImage(stamp, 0, 0)
      context.globalAlpha = 1
      paintLifted(motion.lifts)
      texture.needsUpdate = true
    }

    function draw(nextLocale: Locale) {
      layout(localize(object.label, nextLocale), nextLocale)
      paintBackground()
      paintStamp()
      render()
    }

    function animate(hovered: boolean, time: number, reduced: boolean) {
      if (reduced) hovered = false
      if (hovered !== motion.hovered) {
        motion.hovered = hovered
        motion.changedAt = time
        motion.settled = false
        if (!hovered) motion.liftsAtLeave = [...motion.lifts]
      }
      if (motion.settled || time - motion.lastDraw < FRAME_INTERVAL_MS) return
      const elapsed = time - motion.changedAt
      if (hovered) {
        motion.lifts = units.map((_, index) => {
          const up = rise((elapsed - index * STAGGER_MS) / RISE_MS)
          // Once risen, the letters keep a slow travelling wave.
          return up * (1 + 0.22 * Math.sin(time / 240 - index * 0.75))
        })
      }
      else {
        const fall = Math.min(1, elapsed / FALL_MS)
        const eased = 1 - (1 - fall) ** 3
        motion.lifts = motion.liftsAtLeave.map(value => value * (1 - eased))
        if (fall >= 1) motion.settled = true
      }
      motion.lastDraw = time
      render()
    }

    draw(locale)
    const group = new Group()
    group.name = `root_library_frame_${panel.id}`
    group.position.set(panel.x, panel.y, -0.32)
    group.visible = false

    const backGeometry = new BoxGeometry(0.5, 0.2, 0.028)
    const backMaterial = new MeshStandardMaterial({ color: '#252b30', roughness: 0.72, metalness: 0.25 })
    const back = new Mesh(backGeometry, backMaterial)
    // The existing suffix resolver makes the physical frame clickable too.
    back.name = `${object.mesh}__1`
    const faceGeometry = new PlaneGeometry(0.478, 0.176)
    const faceMaterial = new MeshBasicMaterial({ map: texture, toneMapped: false })
    faceMaterial.color.setScalar(0)
    const face = new Mesh(faceGeometry, faceMaterial)
    face.name = object.mesh
    face.position.z = 0.016
    group.add(back, face)
    model.add(group)

    return {
      group, faceMaterial, draw, animate,
      tilt(time: number, reduced: boolean) {
        const strongest = Math.max(0, ...motion.lifts)
        // A slight lean toward the viewer makes the rising letters read as 3D.
        group.rotation.x = reduced ? 0 : 0.09 * Math.min(1, strongest)
        group.rotation.y = reduced ? 0 : 0.035 * Math.min(1, strongest) * Math.sin(time / 520)
      },
      dispose() {
        group.removeFromParent()
        backGeometry.dispose()
        faceGeometry.dispose()
        backMaterial.dispose()
        faceMaterial.dispose()
        texture.dispose()
      },
    }
  })

  let disposed = false
  // Canvas text cannot reflow, and canvas use alone never triggers a web-font
  // download: request the bold face explicitly, then repaint.
  Promise.resolve(document.fonts?.load('700 100px Manrope')).then(() => document.fonts?.ready).then(() => {
    if (!disposed) frames.forEach(frame => frame.draw(currentLocale))
  }).catch(() => {})

  return {
    update(accents: number) {
      for (const frame of frames) {
        frame.faceMaterial.color.setScalar(accents)
        frame.group.visible = accents > 0
      }
    },
    /** Called from the room's render loop; idle frames return before touching the canvas. */
    animate(hoveredId: string | null, time: number, reduced: boolean) {
      frames.forEach((frame, index) => {
        if (!frame.group.visible) return
        frame.animate(hoveredId === `library_${panels[index]!.id}`, time, reduced)
        frame.tilt(time, reduced)
      })
    },
    updateLocale(nextLocale: Locale) {
      if (nextLocale === currentLocale) return
      currentLocale = nextLocale
      frames.forEach(frame => frame.draw(nextLocale))
    },
    dispose() {
      disposed = true
      frames.forEach(frame => frame.dispose())
    },
  }
}
