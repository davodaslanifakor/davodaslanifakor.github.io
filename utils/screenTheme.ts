/** Shared screen tokens, kept independent of Three.js for the HUD and store. */
export interface ScreenPalette {
  base: string
  ink: string
  accent: string
  /** Far, middle and near mountain silhouettes. */
  landscape: readonly [string, string, string]
}

export type ScreenThemeId = 'slate' | 'forest' | 'amber' | 'mono'
export interface ScreenTheme extends ScreenPalette {
  id: ScreenThemeId
}

export const SCREEN_THEMES = {
  slate: { id: 'slate', base: '#20313f', ink: '#ecf0ed', accent: '#b8ced6', landscape: ['#3b5162', '#2c4151', '#1b2c39'] },
  forest: { id: 'forest', base: '#1d302b', ink: '#ecf0e6', accent: '#b8d0a0', landscape: ['#415b4a', '#2e473c', '#172c27'] },
  amber: { id: 'amber', base: '#352a24', ink: '#f4ede0', accent: '#e4bc83', landscape: ['#695342', '#4e3d32', '#2e251f'] },
  mono: { id: 'mono', base: '#292b2d', ink: '#eeedea', accent: '#c7c9c8', landscape: ['#55585a', '#3e4143', '#242628'] },
} as const satisfies Record<ScreenThemeId, ScreenTheme>
