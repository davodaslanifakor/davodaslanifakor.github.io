import { describe, expect, it, vi } from 'vitest'
import { defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue'
import { Object3D, Vector3 } from 'three'
import { flushPromises, mount } from '@vue/test-utils'
import { getHandAngles, getWorldClockReading, getZonedTimeParts } from '../utils/worldTime'
import { screenContent } from '../content/portfolio'
import { useWorldClocks } from '../composables/useWorldClocks'
import { useWorldTime } from '../composables/useWorldTime'

describe('world time calculations', () => {
  it('uses IANA zones for the same winter and summer UTC instant', () => {
    const winter = Date.parse('2026-01-15T12:00:00Z')
    const summer = Date.parse('2026-07-15T12:00:00Z')
    expect(screenContent.cities.map(item => getWorldClockReading(winter, item, 'en').time)).toEqual([
      '15:00', '12:00', '13:00', '12:00',
    ])
    expect(screenContent.cities.map(item => getWorldClockReading(summer, item, 'en').time)).toEqual([
      '15:00', '13:00', '14:00', '12:00',
    ])
  })

  it('handles midnight rollover in a zone without depending on runner timezone', () => {
    const parts = getZonedTimeParts(Date.parse('2026-01-15T23:30:00Z'), 'Europe/Istanbul')
    expect(parts).toEqual({ year: 2026, month: 1, day: 16, hour: 2, minute: 30, second: 0 })
  })

  it('follows both daylight-saving transitions in London', () => {
    const springBefore = getZonedTimeParts(Date.parse('2026-03-29T00:59:59Z'), 'Europe/London')
    const springAfter = getZonedTimeParts(Date.parse('2026-03-29T01:00:00Z'), 'Europe/London')
    expect([springBefore.hour, springAfter.hour]).toEqual([0, 2])
    const autumnBefore = getZonedTimeParts(Date.parse('2026-10-25T00:59:59Z'), 'Europe/London')
    const autumnAfter = getZonedTimeParts(Date.parse('2026-10-25T01:00:00Z'), 'Europe/London')
    expect([autumnBefore.hour, autumnAfter.hour]).toEqual([1, 1])
    expect(autumnAfter.minute).toBe(0)
  })

  it('calculates absolute clockwise hand angles without accumulated rotation', () => {
    const zone = 'Europe/London'
    expect(getHandAngles(Date.parse('2026-01-15T03:00:00Z'), zone)).toEqual({ hour: 90, minute: 0, second: 0 })
    expect(getHandAngles(Date.parse('2026-01-15T06:00:00Z'), zone)).toEqual({ hour: 180, minute: 0, second: 0 })
    expect(getHandAngles(Date.parse('2026-01-15T09:00:00Z'), zone)).toEqual({ hour: 270, minute: 0, second: 0 })
  })

  it.each(['atlantic', 'reykjavik'])('binds %s GLB pivots to the shared epoch and freezes second hands for reduced motion', async (atlanticId) => {
    const model = new Object3D()
    for (const city of screenContent.cities) {
      for (const hand of ['hour', 'minute', 'second']) {
        const pivot = new Object3D()
        pivot.name = `static_world_clock_${city.id === 'atlantic' ? atlanticId : city.id}_${hand}_pivot`
        pivot.rotation.x = Math.PI / 2
        model.add(pivot)
      }
    }
    const scene = shallowRef(model)
    const epoch = ref(Date.parse('2026-01-15T03:00:00Z'))
    const reducedMotion = ref(false)
    const scope = effectScope()
    scope.run(() => useWorldClocks(scene, epoch, reducedMotion))
    await nextTick()
    expect(model.getObjectByName(`static_world_clock_${atlanticId}_hour_pivot`)!.rotation.y).toBeCloseTo(-Math.PI / 2)
    const londonHour = model.getObjectByName('static_world_clock_london_hour_pivot')!
    expect(londonHour.rotation.y).toBeCloseTo(-Math.PI / 2)
    expect(new Vector3(0, 0, -1).applyEuler(londonHour.rotation).x).toBeCloseTo(1)
    const londonSecond = model.getObjectByName('static_world_clock_london_second_pivot')!
    expect(londonSecond.visible).toBe(true)
    reducedMotion.value = true
    await nextTick()
    expect(londonSecond.visible).toBe(false)
    scope.stop()
  })


  it('aligns updates to the wall clock, pauses when hidden, resyncs, and cleans up', async () => {
    vi.useFakeTimers()
    const start = Date.parse('2026-01-15T12:00:00.000Z')
    vi.setSystemTime(start)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const Host = defineComponent({
      setup() {
        const { epochMs } = useWorldTime()
        return () => h('output', String(epochMs.value))
      },
    })
    const wrapper = mount(Host)
    await flushPromises()
    expect(wrapper.text()).toBe(String(start))
    await vi.advanceTimersByTimeAsync(1_008)
    expect(wrapper.text()).toBe(String(start + 1_008))

    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    vi.setSystemTime(start + 10_000)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(wrapper.text()).toBe(String(start + 1_008))

    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(wrapper.text()).toBe(String(start + 15_000))
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
    visibility.mockRestore()
    vi.useRealTimers()
  })
})
