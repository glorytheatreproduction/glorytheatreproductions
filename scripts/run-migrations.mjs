#!/usr/bin/env node
/**
 * Apply CMS migrations via Supabase Postgres (requires SUPABASE_DB_PASSWORD).
 * Tries multiple pooler regions automatically.
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const password = process.env.SUPABASE_DB_PASSWORD

if (!url || !password) {
  console.error('Need SUPABASE_URL and SUPABASE_DB_PASSWORD in .env.local')
  process.exit(1)
}

const ref = url.replace('https://', '').split('.')[0]
const regions = [
  'aws-0-us-east-1',
  'aws-0-eu-west-1',
  'aws-0-eu-central-1',
  'aws-0-ap-southeast-1',
  'aws-0-us-west-1',
]

const migrationsDir = join(root, 'supabase', 'migrations')
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

async function connect() {
  for (const region of regions) {
    const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${region}.pooler.supabase.com:6543/postgres`
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
    try {
      await client.connect()
      console.log(`Connected via ${region}`)
      return client
    } catch {
      await client.end().catch(() => {})
    }
  }
  throw new Error('Could not connect — check SUPABASE_DB_PASSWORD in .env.local')
}

const client = await connect()

try {
  for (const file of files) {
    console.log(`Running ${file}…`)
    await client.query(readFileSync(join(migrationsDir, file), 'utf8'))
    console.log(`  ✓ ${file}`)
  }
  console.log('Migrations complete.')
} finally {
  await client.end()
}
