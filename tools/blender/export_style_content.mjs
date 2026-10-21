import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { profile, screenContent, skills } from '../../content/portfolio.ts'

const root = dirname(fileURLToPath(import.meta.url))
const output = resolve(root, 'generated/style-content.json')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify({
  profile: { name: profile.name, specialties: profile.specialties },
  skills: skills.slice(0, 6),
  cities: screenContent.cities,
}, null, 2)}\n`)
console.log(`Exported preview content: ${output}`)
