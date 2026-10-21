import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { keyboardRows, phoneDebugCopy, screenContent } from '../../content/portfolio.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const output = resolve(root, 'tools/blender/generated/room-content.json')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify({ cities: screenContent.cities, keyboardRows, phoneDebugCopy }, null, 2)}\n`)
console.log(`Exported room content: ${output}`)
