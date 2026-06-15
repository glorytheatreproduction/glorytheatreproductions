#!/usr/bin/env node
import { loadEnvLocal } from './loadEnvLocal.js'
loadEnvLocal()

import { createNodeClient } from '../shared/lib/supabaseNode.js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const role = process.env.ADMIN_ROLE || 'admin'

if (!url || !serviceKey || !email || !password) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

const supabase = createNodeClient(url, serviceKey)

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail)
    if (match) return match
    if (data.users.length < perPage) break
    page += 1
  }

  return null
}

let userId = null

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: 'Site Admin' },
})

if (createError) {
  if (!createError.message.includes('already been registered')) {
    console.error('Create user failed:', createError.message)
    process.exit(1)
  }

  const existing = await findUserByEmail(email)
  if (!existing) {
    console.error('User exists but could not be found for password reset')
    process.exit(1)
  }

  userId = existing.id
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  })

  if (updateError) {
    console.error('Password reset failed:', updateError.message)
    process.exit(1)
  }

  console.log(`Updated password for existing admin: ${email}`)
} else {
  userId = created.user.id
  console.log(`Created admin: ${email}`)
}

const { error: profileError } = await supabase.from('profiles').upsert({
  user_id: userId,
  email,
  full_name: 'Site Admin',
  role,
  status: 'active',
  updated_at: new Date().toISOString(),
})

if (profileError) {
  console.error('Profile upsert failed:', profileError.message)
  process.exit(1)
}

console.log('Admin ready. Sign in at /admin/login')
console.log(`Email: ${email}`)
