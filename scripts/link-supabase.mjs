#!/usr/bin/env node
/**
 * Link local repo to Supabase project and push migrations.
 *
 * Prerequisites:
 *   1. supabase login          (or set SUPABASE_ACCESS_TOKEN)
 *   2. SUPABASE_DB_PASSWORD in .env.local (Settings → Database)
 *
 * Usage: npm run supabase:link
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadEnvLocal } from './loadEnvLocal.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const PROJECT_REF = 'xjywhejhnplrdxyulnvk'

loadEnvLocal()

const tempDir = join(root, 'supabase', '.temp')
mkdirSync(tempDir, { recursive: true })
writeFileSync(join(tempDir, 'project-ref'), PROJECT_REF, 'utf8')

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  const projects = spawnSync('supabase', ['projects', 'list'], { cwd: root, encoding: 'utf8' })
  if (projects.status !== 0) {
    console.error('\nNot logged in to Supabase CLI.')
    console.error('Run:  supabase login')
    console.error('Then: npm run supabase:link')
    process.exit(1)
  }
}

const password = process.env.SUPABASE_DB_PASSWORD
if (!password) {
  console.error('\nMissing SUPABASE_DB_PASSWORD in .env.local')
  console.error('Get it from Supabase → Settings → Database → Database password')
  process.exit(1)
}

run('supabase', ['link', '--project-ref', PROJECT_REF, '--password', password, '--yes'])
run('supabase', ['db', 'push', '--yes'])

console.log('\nLinked and migrations pushed. Next: npm run cms:seed && npm run cms:create-admin')
