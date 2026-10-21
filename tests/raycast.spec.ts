import { describe, expect, it } from 'vitest'
import { Object3D } from 'three'
import { normalizeMeshName, resolveInteractiveMeshName, useRaycast } from '../composables/useRaycast'
import { sceneObjects } from '../content/portfolio'

describe('interactive mesh resolution', () => {
  it('maps suffixed meshes back to their owning object', () => {
    expect(normalizeMeshName('int_speakers__2')).toBe('int_speakers')
    expect(normalizeMeshName('int_monitor__2')).toBe('int_monitor')
    expect(normalizeMeshName('int_world_clocks__4')).toBe('int_world_clocks')
    expect(normalizeMeshName('int_phone__2')).toBe('int_phone')
  })

  it('keeps ids that contain underscores intact', () => {
    expect(normalizeMeshName('int_screen_left')).toBe('int_screen_left')
    expect(normalizeMeshName('int_screen_right')).toBe('int_screen_right')
  })

  it('treats the laptop screen as the laptop, per the mesh contract', () => {
    expect(normalizeMeshName('int_monitor_screen')).toBe('int_monitor')
  })

  it('walks up to the nearest interactive ancestor', () => {
    const parent = new Object3D()
    parent.name = 'int_elephant'
    const child = new Object3D()
    child.name = 'static_elephant_tail'
    parent.add(child)

    expect(resolveInteractiveMeshName(child)).toBe('int_elephant')
    expect(resolveInteractiveMeshName(new Object3D())).toBeNull()
  })

  it('opens Joker’s game from static figure parts without renaming the Blender root', () => {
    const root = new Object3D(), head = new Object3D()
    root.name = 'root_bugjar'
    head.name = 'static_bugjar_head'
    root.add(head)
    const raycast = useRaycast({ objects: sceneObjects })
    expect(raycast.resolveObject({ object: head })).toMatchObject({ id: 'bugjar', action: 'play-game' })
  })

  it('activates the right object for every mesh the model exports', () => {
    const activated: string[] = []
    const { handleActivate } = useRaycast({
      objects: () => sceneObjects,
      onActivate: object => activated.push(object.id),
    })

    const meshNames = [
      'int_monitor_screen',
      'int_screen_left',
      'int_screen_right',
      'int_clock',
      'int_elephant',
      'int_bugjar',
      'int_paratrooper',
      'int_robot',
      'int_cards__2',
      'int_plush',
      'int_speakers__2',
      'int_world_clocks',
      'int_world_clocks__2',
      'int_world_clocks__3',
      'int_world_clocks__4',
      'int_phone',
      'int_phone__2',
    ]

    for (const meshName of meshNames) {
      const object = new Object3D()
      object.name = meshName
      handleActivate({ object })
    }

    expect(activated).toEqual([
      'monitor',
      'screen_left',
      'screen_right',
      'clock',
      'elephant',
      'bugjar',
      'paratrooper',
      'robot',
      'cards',
      'speakers',
      'world_clocks',
      'world_clocks',
      'world_clocks',
      'world_clocks',
      'phone',
      'phone',
    ])
  })
})
