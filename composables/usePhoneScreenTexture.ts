import { onScopeDispose } from 'vue'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { localize, profile, roles, ui } from '~/content/portfolio'

/** The desk phone shows a miniature of the CV's mobile layout; painted once. */
export function usePhoneScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 240
  canvas.height = 480
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = false

  function paint() {
    const { width: w, height: h } = canvas
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#101214'; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#3a3f37'; ctx.lineWidth = 1.5; ctx.strokeRect(18, 22, 30, 30)
    ctx.fillStyle = '#d8ff3e'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('DF', 33, 42)
    ctx.textAlign = 'left'
    ctx.strokeStyle = '#d8ff3e'; ctx.beginPath(); ctx.roundRect(18, 82, 150, 20, 10); ctx.stroke()
    ctx.fillStyle = '#d8ff3e'; ctx.font = '9px monospace'; ctx.fillText(localize(ui.lifeStory, 'en').toUpperCase(), 28, 95)
    ctx.fillStyle = '#f2efe8'; ctx.font = '700 34px system-ui'
    profile.name.split(' ').forEach((part, index) => ctx.fillText(part, 18, 146 + index * 36))
    ctx.fillStyle = '#8f9389'; ctx.font = '10px monospace'; ctx.fillText(localize(profile.role, 'en').slice(0, 30).toUpperCase(), 18, 206)
    ctx.fillStyle = '#f2efe8'; ctx.font = '600 16px system-ui'; ctx.fillText(localize(ui.experience, 'en'), 18, 250)
    roles.slice(0, 4).forEach((role, index) => {
      const y = 268 + index * 46
      ctx.fillStyle = '#2a2e2b'; ctx.fillRect(18, y, w - 36, 1)
      ctx.fillStyle = '#f2efe8'; ctx.font = '600 12px system-ui'; ctx.fillText(role.company.replace(/ \(.*\)/, ''), 18, y + 20)
      ctx.fillStyle = '#8f9389'; ctx.font = '9px monospace'; ctx.fillText(role.period.toUpperCase(), 18, y + 35)
    })
    ctx.fillStyle = '#5b5f58'; ctx.beginPath(); ctx.roundRect(85, h - 13, 70, 4, 2); ctx.fill()
    texture.needsUpdate = true
  }

  paint()
  onScopeDispose(() => texture.dispose())
  return texture
}
