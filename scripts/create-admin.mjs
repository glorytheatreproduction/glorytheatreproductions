#!/usr/bin/env node
import { loadEnvLocal } from './loadEnvLocal.js'
loadEnvLocal()

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!url || !serviceKey || !email || !password) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: 'Site Admin' },
})

if (createError && !createError.message.includes('already been registered')) {
  console.error('Create user failed:', createError.message)
  process.exit(1)
}

let userId = created?.user?.id

if (!userId) {
  const { data: list } = await supabase.auth.admin.listUsers()
  userId = list?.users?.find((u) => u.email === email)?.id
}

if (!userId) {
  console.error('Could not resolve admin user id')
  process.exit(1)
}

const { error: profileError } = await supabase.from('profiles').upsert({
  user_id: userId,
  email,
  full_name: 'Site Admin',
  role: 'admin',
  status: 'active',
  updated_at: new Date().toISOString(),
})

if (profileError) {
  console.error('Profile upsert failed:', profileError.message)
  process.exit(1)
}

console.log(`Admin ready: ${email}`)
console.log('Sign in at /admin/login')
