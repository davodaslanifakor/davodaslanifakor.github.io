import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MiniEditor from '../components/editor/MiniEditor.vue'

describe('MiniEditor keyboard parity', () => {
  it('exposes the text block to assistive tech with a keyboard hint', () => {
    const wrapper = mount(MiniEditor, { props: { locale: 'en' } })
    const editable = wrapper.get('.editable')
    expect(editable.attributes('role')).toBe('group')
    expect(editable.attributes('aria-label')).toContain('arrow keys')
    // Pointer-only handles stay out of the tab order.
    expect(editable.get('.handle.resize').attributes('tabindex')).toBe('-1')
    expect(editable.get('.handle.rotate').attributes('tabindex')).toBe('-1')
  })

  it('moves, resizes and rotates the block with the keyboard', async () => {
    const wrapper = mount(MiniEditor, { props: { locale: 'en' } })
    const editable = wrapper.get('.editable')

    await editable.trigger('keydown', { key: 'ArrowRight' })
    expect(editable.attributes('style')).toContain('left: 120px')

    await editable.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(editable.attributes('style')).toContain('top: 66px')

    await editable.trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    expect(editable.attributes('style')).toContain('width: 198px')

    await editable.trigger('keydown', { key: ']' })
    expect(editable.attributes('style')).toContain('rotate(-1deg)')

    await editable.trigger('keydown', { key: '[', shiftKey: true })
    expect(editable.attributes('style')).toContain('rotate(-6deg)')

    await editable.trigger('keydown', { key: 'Escape' })
    expect(editable.attributes('style')).toContain('rotate(-6deg)')
  })

  it('clamps movement, resize and rotation to the page bounds', async () => {
    const wrapper = mount(MiniEditor, { props: { locale: 'en' } })
    const editable = wrapper.get('.editable')
    for (let i = 0; i < 40; i += 1) await editable.trigger('keydown', { key: 'ArrowRight' })
    expect(editable.attributes('style')).toContain('left: 220px')
    for (let i = 0; i < 40; i += 1) await editable.trigger('keydown', { key: 'ArrowDown' })
    expect(editable.attributes('style')).toContain('top: 190px')
    for (let i = 0; i < 40; i += 1) await editable.trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    expect(editable.attributes('style')).toContain('width: 330px')
    for (let i = 0; i < 60; i += 1) await editable.trigger('keydown', { key: ']' })
    expect(editable.attributes('style')).toContain('rotate(25deg)')
  })
})
