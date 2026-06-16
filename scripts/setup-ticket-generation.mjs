#!/usr/bin/env node
/**
 * Apply ticket webhook migration, print/sync webhook secret, process pending tickets.
 */
import { loadEnvLocal } from './loadEnvLocal.js'
import { createNodeClient } from '../shared/lib/supabaseNode.js'

loadEnvLocal()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createNodeClient(url, serviceKey)

const { data: settings, error: settingsError } = await supabase
  .from('cms_internal_settings')
  .select('key, value')
  .in('key', ['generate_ticket_url', 'database_webhook_secret'])

if (settingsError) {
  console.error('Could not read cms_internal_settings:', settingsError.message)
  console.error('Run: supabase db push')
  process.exit(1)
}

const byKey = Object.fromEntries((settings || []).map((row) => [row.key, row.value]))
const webhookSecret = byKey.database_webhook_secret

console.log('\nTicket webhook URL:', byKey.generate_ticket_url || '(not set)')
console.log('\nSet this secret on the generate-ticket Edge Function:')
console.log(`  DATABASE_WEBHOOK_SECRET=${webhookSecret || '(run migration 012 first)'}`)
console.log('\nOptional for designed PDF/PNG tickets + email:')
console.log('  HTML_RENDER_API_KEY=...  (Api2PDF)')
console.log('  RESEND_API_KEY=...')
console.log('  FROM_EMAIL=Glory Theatre <tickets@yourdomain.com>')
console.log('\n  supabase secrets set DATABASE_WEBHOOK_SECRET=... --project-ref xjywhejhnplrdxyulnvk')

const fnUrl = `${url}/functions/v1/generate-ticket`
const { data: pending } = await supabase
  .from('registrations')
  .select('id, full_name, ticket_status')
  .in('ticket_status', ['pending', 'failed'])

if (!pending?.length) {
  console.log('\nNo pending/failed registrations to process.')
  process.exit(0)
}

console.log(`\nProcessing ${pending.length} registration(s)...`)

for (const reg of pending) {
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret || '',
    },
    body: JSON.stringify({ registration_id: reg.id }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`  ✗ ${reg.full_name}: ${body.error || res.status}`)
  } else {
    console.log(`  ✓ ${reg.full_name}: ${body.ticket_status || 'ok'}`)
  }
}
