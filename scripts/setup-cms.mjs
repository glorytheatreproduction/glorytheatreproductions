#!/usr/bin/env node
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    const val = trimmed.slice(i + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {
  console.warn('No .env.local found — using shell env only')
}

const steps = [
  ['Migrations', 'node', ['scripts/run-migrations.mjs']],
  ['Seed', 'node', ['scripts/seed-cms.mjs']],
  ['Admin', 'node', ['scripts/create-admin.mjs']],
]

for (const [label, cmd, args] of steps) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(cmd, args, { stdio: 'inherit', env: process.env })
  if (result.status !== 0) {
    console.error(`\n${label} failed (exit ${result.status})`)
    process.exit(result.status ?? 1)
  }
}

console.log('\nSetup complete. Add VITE_SUPABASE_ANON_KEY to .env.local, restart dev server, then open /admin/login')
