import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import ScreenThemePicker from '../components/ui/ScreenThemePicker.vue'
import { useSceneStore } from '../stores/scene'
import { ui } from '../content/portfolio'

describe('screen style preview', () => {
  it('starts collapsed, selects a shared theme and retains it when Escape returns focus', async () => {
    setActivePinia(createPinia())
    const scene = useSceneStore()
    const host = defineComponent({
      setup: () => () => h(ScreenThemePicker, { theme: scene.screenTheme, locale: 'en', onSelect: scene.setScreenTheme }),
    })
    const wrapper = mount(host, { attachTo: document.body })
    try {
      const details = wrapper.get('details').element as HTMLDetailsElement
      const summary = wrapper.get('summary')
      expect(details.open).toBe(false)
      expect(summary.text()).toBe(ui.screenStylePreview.en)
      const slate = wrapper.get<HTMLInputElement>('input[value="slate"]')
      expect(slate.element.checked).toBe(true)
      details.open = true
      const forest = wrapper.get<HTMLInputElement>('input[value="forest"]')
      await forest.setValue(true)
      expect(scene.screenTheme).toBe('forest')
      expect(slate.element.checked).toBe(false)
      forest.element.focus()
      await forest.trigger('keydown', { key: 'Escape' })
      expect(details.open).toBe(false)
      expect(document.activeElement).toBe(summary.element)
      details.open = true
      expect(forest.element.checked).toBe(true)
      await forest.trigger('keydown', { key: 'End' })
      const mono = wrapper.get<HTMLInputElement>('input[value="mono"]')
      expect(scene.screenTheme).toBe('mono')
      expect(document.activeElement).toBe(mono.element)
      await mono.trigger('keydown', { key: 'ArrowRight' })
      expect(scene.screenTheme).toBe('slate')
      expect(document.activeElement).toBe(slate.element)
      await slate.trigger('keydown', { key: 'ArrowLeft' })
      expect(scene.screenTheme).toBe('mono')
      await mono.trigger('keydown', { key: 'Home' })
      expect(scene.screenTheme).toBe('slate')
    } finally { wrapper.unmount() }
  })
})
