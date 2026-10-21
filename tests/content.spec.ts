import { describe, expect, it } from 'vitest'
import { caseStudies, roles, sceneObjects, screenContent, skills } from '../content/portfolio'

describe('portfolio content contracts', () => {
  it('defines every interactive room object with unique mesh names', () => {
    expect(sceneObjects).toHaveLength(18)
    expect(sceneObjects.map((object) => object.id)).toEqual([
      'library_about', 'library_story', 'library_career', 'library_contact',
      'monitor', 'screen_left', 'screen_right', 'clock', 'elephant', 'bugjar',
      'paratrooper', 'robot', 'cards', 'speakers', 'world_clocks', 'phone', 'certificate', 'library_portrait',
    ])
    expect(new Set(sceneObjects.map((object) => object.mesh)).size).toBe(sceneObjects.length)
    expect(sceneObjects.every((object) => object.mesh.startsWith('int_'))).toBe(true)
  })

  it('keeps localized fields complete', () => {
    for (const role of roles) {
      expect(role.title.en).toBeTruthy()
      expect(role.title.fa).toBeTruthy()
      expect(role.receipt.en).toBeTruthy()
    }
    for (const skill of skills) expect(skill.usedFor.fa).toBeTruthy()
    for (const study of caseStudies) expect(study.result.en).toBeTruthy()
  })

  it('keeps the location claim on the laptop screen, per the desk plan', () => {
    const cities = screenContent.cities.map(city => city.label)
    expect(cities).toContain('Turkey')
    expect(cities.every(label => /^[\w\s-]+$/.test(label))).toBe(true)
    expect(screenContent.cities.map(city => city.timeZone)).toEqual([
      'Europe/Istanbul', 'Europe/London', 'Europe/Stockholm', 'Atlantic/Reykjavik',
    ])
    expect(sceneObjects.find((object) => object.id === 'phone')?.contentRef).toBe('mobile-preview')
    expect(sceneObjects.find((object) => object.id === 'world_clocks')?.contentRef).toBe('world-clocks')
  })

  it('lists every dated role newest first, from the confirmed LinkedIn profile', () => {
    expect(roles.map((role) => role.period)).toEqual([
      'Sep 2024 – Present', 'Sep 2023 – Sep 2024', 'Sep 2022 – Oct 2023', 'Apr 2017 – Sep 2022', 'Dec 2015 – Feb 2017',
    ])
  })
})
