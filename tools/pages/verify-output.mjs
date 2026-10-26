import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const output = '.output/public'
const site = process.env.NUXT_PUBLIC_SITE_URL || 'https://davodaslanifakor.github.io'
for (const file of ['index.html', 'cv/index.html', '404.html', '.nojekyll', 'models/room.glb', 'models/joker-adventure.glb', 'modaltor/index.html', 'studio/index.html', 'studio/motion/index.html', 'studio/Davoud_Aslani_Fakour_Resume.pdf']) {
  assert.ok(existsSync(join(output, file)), `Missing Pages output: ${file}`)
}
const room = readFileSync(join(output, 'index.html'), 'utf8')
const cv = readFileSync(join(output, 'cv/index.html'), 'utf8')
assert.ok(room.includes('Behind the Build'), 'The homepage must contain prerendered portfolio content')
assert.ok(cv.includes('Davoud Aslani Fakour') && cv.includes('Experience'), 'The CV must contain readable HTML before JavaScript runs')
for (const html of [room, cv]) {
  assert.ok(html.includes(new URL('/og-portfolio.jpg', site).href), 'Sharing images must use the public site origin')
  assert.doesNotMatch(html, /<link[^>]+(?:href="[^"]*(?:localhost|127\.0\.0\.1))[^>]*>/, 'Public page links must not point to the build server')
}
assert.ok(room.includes(`href="${new URL('/', site).href}"`), 'Missing homepage canonical URL')
assert.ok(cv.includes(`href="${new URL('/cv/', site).href}"`), 'Missing CV canonical URL')
const legacy = JSON.parse(readFileSync('tools/pages/legacy-manifest.json', 'utf8'))
for (const file of legacy.files) {
  const bytes = readFileSync(join(output, file.path))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `Legacy demo changed or was omitted: ${file.path}`)
}
console.log(`Pages output verified: prerendered room/CV, public sharing URLs, 3D assets and ${legacy.files.length} unchanged legacy demo files.`)

const studio = readFileSync(join(output, 'studio/index.html'), 'utf8')
assert.ok(studio.includes(new URL('/studio/', site).href), 'Missing Studio canonical URL')
assert.ok(studio.includes('Download CV') && studio.includes('Zoviz'), 'Studio must prerender its content and CV CTA')
assert.doesNotMatch(studio, /name="robots"[^>]+noindex/, 'Published Studio must be indexable')
assert.equal(
  createHash('sha256').update(readFileSync(join(output, 'studio/Davoud_Aslani_Fakour_Resume.pdf'))).digest('hex'),
  createHash('sha256').update(readFileSync('public/studio/Davoud_Aslani_Fakour_Resume.pdf')).digest('hex'),
  'Published download must match the final resume',
)
console.log('Studio output verified: canonical URL, readable content and final CV download.')

for (const file of ['index.html', 'cv/index.html', 'studio/index.html']) {
  const html = readFileSync(join(output, file), 'utf8')
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]))
  const person = schemas.find(schema => schema['@type'] === 'Person')
  assert.ok(person, `Missing server-rendered Person identity: ${file}`)
  assert.equal(person.name, 'Davoud Aslani Fakour', `Wrong identity name: ${file}`)
  assert.equal(person['@id'], new URL('/#person', site).href, `Identity ID must match across pages: ${file}`)
  for (const profile of [
    'https://github.com/davodaslanifakor',
    'https://www.linkedin.com/in/davoud-fakour',
    'https://medium.com/@DavoudAslaniFakour',
    new URL('/', site).href,
  ]) assert.ok(person.sameAs.includes(profile), `Missing identity link ${profile}: ${file}`)
}
console.log('Identity verified: one full name, stable Person ID and four sameAs links on room, CV and Studio.')
