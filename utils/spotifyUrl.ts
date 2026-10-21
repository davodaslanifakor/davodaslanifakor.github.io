/** Canonical resource URLs keep tracking parameters out of player state. */
export function spotifyResource(value: string) {
  try {
    const url = new URL(value)
    const match = url.pathname.match(/^\/(?:embed\/)?(track|playlist|album)\/([A-Za-z0-9]+)\/?$/)
    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com' || !match) return null
    return { type: match[1]!, id: match[2]!, uri: `spotify:${match[1]}:${match[2]}`, url: `https://open.spotify.com/${match[1]}/${match[2]}`, embed: `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0` }
  } catch { return null }
}
