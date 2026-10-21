import { Box3, PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { libraryPortraitFocus } from '../utils/libraryArtwork'
import { deskModel } from './helpers/deskModel'

describe('portrait focus', () => {
  it('centers the existing portrait in a close view on desktop and mobile', () => {
    const asset = deskModel()
    try {
      for (const aspect of [16 / 9, 390 / 844]) {
        const focus = libraryPortraitFocus(asset.model, aspect)[0]!
        const camera = new PerspectiveCamera(38, aspect, .05, 50)
        camera.position.copy(focus.position); camera.lookAt(focus.target); camera.updateMatrixWorld()
        const portrait = asset.model.getObjectByName('static_style_art_portrait')!
        const center = new Box3().setFromObject(portrait).getCenter(new Vector3()).project(camera)
        expect(Math.abs(center.x)).toBeLessThan(.1)
        expect(Math.abs(center.y)).toBeLessThan(.1)
        expect(camera.position.distanceTo(focus.target)).toBeLessThan(1)
      }
    } finally { asset.dispose() }
  })
})
