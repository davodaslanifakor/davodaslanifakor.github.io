import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MusicList from '../components/music/MusicList.vue'
import MusicPreview from '../components/music/MusicPreview.vue'
import MonitorMusicSurface from '../components/scene/MonitorMusicSurface.vue'
import { favouriteMusic, ui } from '../content/portfolio'

vi.mock('../utils/spotifyIframeApi', () => ({
  loadSpotifyIframeApi: async () => ({
    createController(element: HTMLElement, options: { url: string; height: number }, callback: (controller: unknown) => void) {
      const frame = document.createElement('iframe')
      frame.src = options.url.replace('open.spotify.com/', 'open.spotify.com/embed/')
      frame.height = String(options.height)
      element.replaceWith(frame)
      callback({ addListener() {}, destroy() { frame.remove() } })
    },
  }),
}))

describe('monitor music library', () => {
  it('routes a library selection to the separate preview without loading Spotify itself', async () => {
    const wrapper = mount(MusicList, { props: { locale: 'en', selectedId: null } })
    try {
      expect(wrapper.findAll('iframe')).toHaveLength(0)
      expect(wrapper.findAll('button')).toHaveLength(favouriteMusic.length)
      await wrapper.findAll('button')[0]!.trigger('click')
      expect(wrapper.emitted('select')).toEqual([[favouriteMusic[0]!.id]])
      await wrapper.setProps({ selectedId: favouriteMusic[0]!.id })
    await flushPromises()
      expect(wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('true')
      expect(wrapper.text()).not.toContain('Sample mix')
    } finally { wrapper.unmount() }
  })

  it('uses Persian copy and accessible track labels', () => {
    const wrapper = mount(MusicList, { props: { locale: 'fa', selectedId: null } })
    try {
      expect(wrapper.text()).toContain(ui.musicRadio.fa)
      expect(wrapper.findAll('button')[0]!.attributes('aria-label')).toContain(ui.musicLoad.fa)
    } finally { wrapper.unmount() }
  })
})

it('loads the real full-height preview only on selection, replaces one iframe and clears it', async () => {
  const wrapper = mount(MusicPreview, { props: { locale: 'en', selectedId: null } })
  try {
    expect(wrapper.findAll('iframe')).toHaveLength(0)
    expect(wrapper.text()).toContain(ui.musicChoose.en)
    await wrapper.setProps({ selectedId: favouriteMusic[0]!.id })
    await flushPromises()
    const original = wrapper.get('iframe').element
    expect(wrapper.get('iframe').attributes('src')).toBe(`${favouriteMusic[0]!.spotifyUrl.replace('open.spotify.com/', 'open.spotify.com/embed/')}?theme=0`)
    expect(wrapper.get('iframe').attributes('height')).toBe('352')
    await wrapper.setProps({ selectedId: null })
    expect(wrapper.findAll('iframe')).toHaveLength(0)
    await wrapper.setProps({ selectedId: favouriteMusic[0]!.id })
    await flushPromises()
    expect(wrapper.findAll('iframe')).toHaveLength(1)
    expect(wrapper.get('iframe').element).not.toBe(original)
    const beforeReload = wrapper.get('iframe').element
    await wrapper.get('.reload-player').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('iframe')).toHaveLength(1)
    expect(wrapper.get('iframe').element).not.toBe(beforeReload)
    expect(wrapper.get('iframe').attributes('src')).toContain('playlist/6RgbkiGSEMtH5lYyGfrggE')
    await wrapper.get('.clear-player').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    await wrapper.setProps({ selectedId: null })
    expect(wrapper.findAll('iframe')).toHaveLength(0)
  } finally { wrapper.unmount() }
})


it('keeps the same monitor panels and player mounted when returning to the room', async () => {
  const wrapper = mount(MonitorMusicSurface, { props: { active: true, camera: null, model: null, locale: 'en', selectedId: favouriteMusic[0]!.id } })
  try {
    await flushPromises()
    const iframe = wrapper.get('iframe').element
    const library = wrapper.get('.monitor-panel--library').element
    await wrapper.setProps({ active: false })
    expect(wrapper.get('.monitor-music').attributes('style') ?? '').not.toContain('display: none')
    expect(wrapper.get('.monitor-music').attributes('role')).toBeUndefined()
    expect(wrapper.get('.monitor-music').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.monitor-music').attributes('inert')).toBeDefined()
    expect(wrapper.get('.music-toolbar').attributes('style')).toContain('display: none')
    expect(wrapper.get('.monitor-panel--library').element).toBe(library)
    expect(wrapper.get('iframe').element).toBe(iframe)
    await wrapper.setProps({ active: true })
    expect(wrapper.get('.monitor-music').attributes('role')).toBe('dialog')
    expect(wrapper.get('iframe').element).toBe(iframe)
  } finally { wrapper.unmount() }
})
