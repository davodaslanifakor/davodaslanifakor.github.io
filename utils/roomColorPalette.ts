export type RoomColorMode = 'rgb' | 'warm'

export function createRoomColorUniforms() {
  return { colorTime: { value: 0 }, colorRgb: { value: 1 }, musicPulse: { value: 1 }, musicDrive: { value: 0 }, jokerGlow: { value: 0 } }
}

// World-space wave: adjacent strips, their halos and the desk share the same
// phase at any position. One gentle spectrum pass every 36 seconds.
export const roomColorPalette = `
  uniform float colorTime;
  uniform float colorRgb;
  uniform float musicPulse;
  uniform float musicDrive;
  uniform float jokerGlow;
  vec3 roomSpectrum(vec3 position) {
    // Compress the spatial rainbow during music so broad, unmistakable color
    // bands move around the wall, rather than always showing every color.
    float spatial = dot(position, vec3(0.32, 0.23, 0.19));
    float hue = spatial * mix(1.0, 0.22, musicDrive) - colorTime / 36.0;
    vec3 wave = 0.5 + 0.5 * cos(6.28318530718 * (hue + vec3(0.0, -0.333333, 0.333333)));
    vec3 idle = 0.055 + 0.945 * pow(wave, vec3(1.6));
    vec3 music = 0.006 + 0.994 * pow(wave, vec3(3.0));
    return mix(idle, music, musicDrive) * musicPulse;
  }
  vec3 roomJoker(vec3 position) {
    return mix(vec3(0.42, 0.06, 0.95), vec3(0.2, 0.85, 0.14), smoothstep(-0.7, 0.7, position.x));
  }
  vec3 roomAccent(vec3 position, vec3 warm) {
    vec3 normal = mix(warm, roomSpectrum(position), colorRgb);
    return mix(normal, roomJoker(position), jokerGlow);
  }
`
