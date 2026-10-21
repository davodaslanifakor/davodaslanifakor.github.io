import type { LineSegments, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, WebGLRenderer } from 'three'

// Three's public markers survive separate module copies and development reloads.
// Constructor identity does not, even when both copies are the same version.
function hasMarker(value: unknown, marker: string): boolean {
  return typeof value === 'object' && value !== null && Reflect.get(value, marker) === true
}

export const isMesh = (value: unknown): value is Mesh => hasMarker(value, 'isMesh')
export const isMeshStandardMaterial = (value: unknown): value is MeshStandardMaterial => hasMarker(value, 'isMeshStandardMaterial')
export const isMeshPhysicalMaterial = (value: unknown): value is MeshPhysicalMaterial => hasMarker(value, 'isMeshPhysicalMaterial')
export const isMeshBasicMaterial = (value: unknown): value is MeshBasicMaterial => hasMarker(value, 'isMeshBasicMaterial')
export const isLineSegments = (value: unknown): value is LineSegments => hasMarker(value, 'isLineSegments')
export const isWebGLRenderer = (value: unknown): value is WebGLRenderer => hasMarker(value, 'isWebGLRenderer')
