import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadHandler, netlifyToVercel } from './_adapter.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const handler = loadHandler(join(__dirname, 'lib', 'rsvp-handler.cjs'))

export default netlifyToVercel(handler)
