<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import { BoxGeometry, CanvasTexture, Euler, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, Quaternion, SRGBColorSpace } from 'three'
import type { Object3D } from 'three'
import type { JokerGameState } from '~/composables/useJokerCardGame'
import { jokerCardPose, jokerStage } from '~/utils/jokerGameScene'

const props = defineProps<{ model: Object3D; state: JokerGameState; reducedMotion: boolean; ready: boolean }>()
const stage = jokerStage(props.model)
const group = markRaw(new Group())
group.name = 'joker_game_tray'
group.visible = false
group.position.copy(stage.tray)
const geometries: (BoxGeometry | PlaneGeometry)[] = []
const materials: (MeshBasicMaterial | MeshStandardMaterial)[] = []
const textures: CanvasTexture[] = []

function artwork(kind: 'back' | 'star' | 'diamond') {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 384
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = kind === 'back' ? '#372044' : '#f1ecd9'
  ctx.fillRect(0, 0, 256, 384)
  ctx.strokeStyle = kind === 'back' ? '#a591bd' : '#786486'
  ctx.lineWidth = 3
  ctx.strokeRect(14, 14, 228, 356)
  ctx.strokeRect(21, 21, 214, 342)
  if (kind === 'back') {
    ctx.save(); ctx.beginPath(); ctx.rect(24, 24, 208, 336); ctx.clip()
    ctx.lineWidth = 1; ctx.strokeStyle = '#70527c'
    for (let x = -384; x < 640; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 384, 384); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 384, 384); ctx.stroke()
    }
    ctx.restore()
  } else {
    ctx.fillStyle = kind === 'star' ? '#61378e' : '#5b6956'
    ctx.beginPath()
    const count = kind === 'star' ? 10 : 4
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / count
      const radius = kind === 'star' && i % 2 ? 34 : 76
      const x = 128 + Math.cos(angle) * radius, y = 192 + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.closePath(); ctx.fill()
    ctx.fillRect(30, 32, 8, 16); ctx.fillRect(218, 336, 8, 16)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  textures.push(texture)
  return texture
}
function box(width: number, height: number, depth: number, color: string) {
  const geometry = new BoxGeometry(width, height, depth)
  const material = new MeshStandardMaterial({ color, roughness: 0.8 })
  geometries.push(geometry); materials.push(material)
  return new Mesh(geometry, material)
}
const tray = box(0.272, 0.008, 0.126, '#21182c')
tray.position.y = -0.005
group.add(tray)
// Support the little tray at the desk surface; it should not float beside the speaker.
for (const x of [-0.116, 0.116]) for (const z of [-0.049, 0.049]) {
  const leg = box(0.009, 0.083, 0.009, '#302a36')
  leg.position.set(x, -0.049, z)
  group.add(leg)
}
const felt = box(0.26, 0.002, 0.115, '#4b3456')
felt.position.y = 0
group.add(felt)
const frontMaterials = [artwork('star'), artwork('diamond')].map(map => new MeshBasicMaterial({ map, toneMapped: false }))
const backMaterial = new MeshBasicMaterial({ map: artwork('back'), toneMapped: false })
materials.push(...frontMaterials, backMaterial)
const faceGeometry = new PlaneGeometry(0.051, 0.077)
geometries.push(faceGeometry)
const cards = [0, 1, 2].map((id) => {
  const root = new Group()
  const hit = box(0.052, 0.002, 0.078, '#e2d9c5')
  hit.userData.jokerCardId = id
  const front = new Mesh(faceGeometry, frontMaterials[1])
  front.rotation.x = -Math.PI / 2; front.position.y = 0.0012
  const back = new Mesh(faceGeometry, backMaterial)
  back.rotation.x = Math.PI / 2; back.position.y = -0.0012
  root.add(hit, front, back); group.add(root)
  return { root, hit, front }
})
// Local lighting keeps the game readable even if the visitor has not lit the room.
const key = new PointLight('#fff0dc', 0.45, 1.2, 2)
key.position.set(0, 0.27, 0.14)
group.add(key)
const purple = new PointLight('#ae6eff', 0, 0.6, 2), green = new PointLight('#8bdf85', 0, 0.6, 2)
purple.position.set(-0.15, 0.06, 0); green.position.set(0.15, 0.06, 0)
group.add(purple, green)
const toy = props.model.getObjectByName('root_bugjar')
const originalPosition = toy?.position.clone(), originalRotation = toy?.quaternion.clone()
const rotation = new Quaternion(), angles = new Euler()
let greetingTime = 0

let previousTime: number | null = null
function updateFrame(time: number) {
  const delta = previousTime === null ? 0 : (time - previousTime) / 1000
  previousTime = time
  group.visible = props.ready
  if (!props.ready) return
  greetingTime += Math.min(delta, 0.064)
  cards.forEach((card, id) => {
    const pose = jokerCardPose(props.state, id, props.reducedMotion)
    card.root.position.set(pose.x, pose.y, pose.z)
    card.root.rotation.z = pose.flip
    card.front.material = frontMaterials[id === props.state.winner ? 0 : 1]!
  })
  const result = props.state.phase === 'result'
  const won = result && props.state.slots[props.state.selected!] === props.state.winner
  const progress = Math.min(1, props.state.elapsed / 1600)
  const celebration = won && !props.reducedMotion ? Math.sin(progress * Math.PI) : 0
  purple.intensity = celebration * 0.1; green.intensity = celebration * 0.1
  if (toy && originalPosition && originalRotation) {
    toy.position.copy(originalPosition); toy.quaternion.copy(originalRotation)
    if (!props.reducedMotion) {
      const greeting = Math.max(0, 1 - greetingTime / 1.4) * Math.sin(greetingTime * 7)
      const bow = won ? Math.sin(progress * Math.PI) * 0.18 : 0
      const shake = result && !won ? Math.sin(progress * Math.PI * 6) * (1 - progress) * 0.13 : 0
      angles.set(bow, shake, greeting * 0.1)
      toy.quaternion.multiply(rotation.setFromEuler(angles))
      toy.position.y += Math.abs(greeting) * 0.003
    }
  }
}
onBeforeUnmount(() => {
  if (toy && originalPosition && originalRotation) {
    toy.position.copy(originalPosition); toy.quaternion.copy(originalRotation)
  }
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach(texture => texture.dispose())
})
defineExpose({ pickTargets: cards.map(card => card.hit), updateFrame })
</script>

<template>
  <primitive :object="group" />
</template>
